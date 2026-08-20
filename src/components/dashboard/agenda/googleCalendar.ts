import type { SupabaseClient } from "@supabase/supabase-js";
import { untyped } from "@/lib/integraties";
import {
  isTokenExpired,
  refreshTokens,
  type OAuthTokens,
} from "@/lib/oauth";
import {
  getGoogleCalendarPlatformCredentials,
  GOOGLE_CALENDAR_PROVIDER,
} from "@/components/dashboard/integraties/googleCalendarSetup";

export type GoogleCalendarConnection = {
  connected: boolean;
  accountEmail: string | null;
  platformReady: boolean;
};

export type GoogleCalendarEvent = {
  id: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string | null;
};

type IntegrationConfig = {
  tokens?: OAuthTokens;
  accountEmail?: string;
  clientId?: string;
  clientSecret?: string;
};

function asConfig(raw: unknown): IntegrationConfig {
  return (raw ?? {}) as IntegrationConfig;
}

export async function loadGoogleCalendarConnection(
  supabase: SupabaseClient,
  companyId: number,
): Promise<GoogleCalendarConnection> {
  const platformReady = getGoogleCalendarPlatformCredentials() != null;
  const { data } = await untyped(supabase)
    .from("integraties")
    .select("status, config")
    .eq("bedrijf_id", companyId)
    .eq("provider", GOOGLE_CALENDAR_PROVIDER)
    .maybeSingle();

  const config = asConfig(data?.config);
  return {
    connected: data?.status === "connected" && Boolean(config.tokens?.access_token),
    accountEmail:
      typeof config.accountEmail === "string" ? config.accountEmail : null,
    platformReady,
  };
}

async function persistTokens(
  supabase: SupabaseClient,
  companyId: number,
  config: IntegrationConfig,
  tokens: OAuthTokens,
) {
  const now = new Date().toISOString();
  await untyped(supabase)
    .from("integraties")
    .update({
      config: { ...config, tokens },
      updated_at: now,
    })
    .eq("bedrijf_id", companyId)
    .eq("provider", GOOGLE_CALENDAR_PROVIDER);
}

export async function getValidGoogleAccessToken(
  supabase: SupabaseClient,
  companyId: number,
): Promise<{ accessToken: string } | { error: string }> {
  const { data } = await untyped(supabase)
    .from("integraties")
    .select("status, config")
    .eq("bedrijf_id", companyId)
    .eq("provider", GOOGLE_CALENDAR_PROVIDER)
    .maybeSingle();

  if (!data || data.status !== "connected") {
    return {
      error:
        "Google Calendar is niet gekoppeld. Verbind je account via Agenda of Instellingen → Integraties.",
    };
  }

  const config = asConfig(data.config);
  const tokens = config.tokens;
  if (!tokens?.access_token) {
    return { error: "Google-tokens ontbreken. Verbind opnieuw." };
  }

  if (!isTokenExpired(tokens)) {
    return { accessToken: tokens.access_token };
  }

  if (!tokens.refresh_token) {
    return {
      error: "Google-sessie verlopen. Verbind je account opnieuw.",
    };
  }

  const platform = getGoogleCalendarPlatformCredentials();
  const clientId = platform?.clientId || config.clientId;
  const clientSecret = platform?.clientSecret || config.clientSecret;
  if (!clientId || !clientSecret) {
    return { error: "Google Calendar platform-credentials ontbreken." };
  }

  const refreshed = await refreshTokens(GOOGLE_CALENDAR_PROVIDER, {
    refreshToken: tokens.refresh_token,
    clientId,
    clientSecret,
  });
  if (!refreshed.ok) return { error: refreshed.error };

  await persistTokens(supabase, companyId, config, refreshed.tokens);
  return { accessToken: refreshed.tokens.access_token };
}

export async function listUpcomingEvents(
  accessToken: string,
  options?: { timeMin?: Date; timeMax?: Date; maxResults?: number },
): Promise<{ events: GoogleCalendarEvent[] } | { error: string }> {
  const timeMin = (options?.timeMin ?? new Date(Date.now() - 7 * 86_400_000)).toISOString();
  const timeMax = (
    options?.timeMax ?? new Date(Date.now() + 60 * 86_400_000)
  ).toISOString();
  const maxResults = options?.maxResults ?? 100;

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
  );
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("maxResults", String(maxResults));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      items?: Array<{
        id?: string;
        summary?: string;
        description?: string;
        location?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
      }>;
    };
    if (!res.ok) {
      return {
        error:
          json.error?.message ||
          `Google Calendar API gaf HTTP ${res.status} terug.`,
      };
    }

    const events: GoogleCalendarEvent[] = [];
    for (const item of json.items ?? []) {
      if (!item.id) continue;
      const start =
        item.start?.dateTime ||
        (item.start?.date ? `${item.start.date}T09:00:00` : null);
      if (!start) continue;
      const end =
        item.end?.dateTime ||
        (item.end?.date ? `${item.end.date}T17:00:00` : null);
      events.push({
        id: item.id,
        summary: item.summary?.trim() || "Google-afspraak",
        description: item.description?.trim() || null,
        location: item.location?.trim() || null,
        start: new Date(start).toISOString(),
        end: end ? new Date(end).toISOString() : null,
      });
    }
    return { events };
  } catch (e) {
    return {
      error: `Kon Google Calendar niet bereiken: ${
        e instanceof Error ? e.message : String(e)
      }`,
    };
  }
}

export async function createGoogleEvent(
  accessToken: string,
  input: {
    title: string;
    description?: string | null;
    location?: string | null;
    startIso: string;
    endIso?: string | null;
  },
): Promise<{ eventId: string } | { error: string }> {
  const endIso =
    input.endIso ||
    new Date(new Date(input.startIso).getTime() + 60 * 60_000).toISOString();

  try {
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          summary: input.title,
          description: input.description || undefined,
          location: input.location || undefined,
          start: { dateTime: input.startIso },
          end: { dateTime: endIso },
        }),
      },
    );
    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      error?: { message?: string };
    };
    if (!res.ok || !json.id) {
      return {
        error:
          json.error?.message ||
          `Google-event aanmaken mislukt (HTTP ${res.status}).`,
      };
    }
    return { eventId: json.id };
  } catch (e) {
    return {
      error: `Kon Google Calendar niet bereiken: ${
        e instanceof Error ? e.message : String(e)
      }`,
    };
  }
}

export function googleEventIdFromDeelnemers(deelnemers: unknown): string | null {
  if (!deelnemers || typeof deelnemers !== "object") return null;
  const id = (deelnemers as { googleEventId?: unknown }).googleEventId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

export function deelnemersWithGoogleEventId(
  existing: unknown,
  googleEventId: string,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  return { ...base, googleEventId };
}
