"use server";

import { revalidatePath } from "next/cache";
import { getToken } from "@vercel/connect";
import { requireWriteAccess } from "@/components/dashboard/context";
import {
  resolveSlackConnectorUid,
  slackTokenParams,
} from "@/components/dashboard/integraties/slackConnect";
import { providerMeta, untyped } from "@/lib/integraties";
import {
  hasOAuth,
  isTokenExpired,
  refreshTokens,
  fetchAccountName,
  type OAuthTokens,
} from "@/lib/oauth";

/** Koppelt (of werkt) een provider bij met de opgegeven configuratie. */
export async function connectIntegration(
  provider: string,
  config: Record<string, string>,
) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;
  const meta = providerMeta(provider);
  if (!meta) return { error: "Onbekende provider." };

  // OAuth-providers met volledige flow: bewaar client-gegevens en zet de
  // status op "configured". De koppeling wordt "connected" na autorisatie.
  const isOAuthFlow = meta.auth === "oauth" && hasOAuth(provider);
  const isConnectFlow = meta.auth === "connect";

  if (meta.auth === "peppol") {
    if (!config.accessPoint) return { error: "Kies een access point." };
    if (!config.participantId?.trim()) {
      return { error: "Vul je Peppol-identificatie in (bv. 0208:BE0123456789)." };
    }
  } else if (isConnectFlow) {
    const connectorUid =
      config.connectorUid?.trim() || process.env.SLACK_CONNECTOR?.trim();
    if (!connectorUid) {
      return {
        error:
          "Vul de Vercel Connect connector-UID in (bv. slack/archon) of stel SLACK_CONNECTOR in.",
      };
    }
    config.connectorUid = connectorUid;
  } else if (isOAuthFlow) {
    if (!config.clientId?.trim() || !config.clientSecret?.trim()) {
      return { error: "Vul Client ID en Client Secret in." };
    }
  } else if (!config.apiKey?.trim()) {
    return { error: "Vul de API-sleutel in." };
  }

  const now = new Date().toISOString();
  const status =
    isOAuthFlow || isConnectFlow ? "configured" : "connected";
  const { error } = await untyped(supabase)
    .from("integraties")
    .upsert(
      {
        bedrijf_id: companyId,
        provider,
        status,
        config,
        connected_at: isOAuthFlow || isConnectFlow ? null : now,
        updated_at: now,
      },
      { onConflict: "bedrijf_id,provider" },
    );

  if (error) return { error: error.message };

  if (meta.auth === "peppol" && config.participantId?.trim()) {
    await untyped(supabase)
      .from("bedrijven")
      .update({
        peppol_participant_id: config.participantId.trim(),
        updated_at: now,
      })
      .eq("id", companyId);
  }

  revalidatePath("/dashboard/integraties");
  return { ok: true, status };
}

/** Verbreekt de koppeling met een provider (config wordt gewist). */
export async function disconnectIntegration(provider: string) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;
  const now = new Date().toISOString();
  const { error } = await untyped(supabase)
    .from("integraties")
    .upsert(
      {
        bedrijf_id: companyId,
        provider,
        status: "disconnected",
        config: {},
        connected_at: null,
        updated_at: now,
      },
      { onConflict: "bedrijf_id,provider" },
    );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/integraties");
  return { ok: true };
}

/**
 * Test een OAuth-koppeling: vernieuwt indien nodig het token en haalt de
 * accountnaam op bij de provider. Bewijst dat de volledige keten werkt.
 */
export async function testIntegration(provider: string) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const meta = providerMeta(provider);
  if (meta?.auth === "connect" && provider === "slack") {
    return testSlackConnection(supabase, companyId);
  }

  if (!hasOAuth(provider)) {
    return { error: "Verbindingstest is alleen beschikbaar voor OAuth-koppelingen." };
  }

  const { data } = await untyped(supabase)
    .from("integraties")
    .select("config")
    .eq("bedrijf_id", companyId)
    .eq("provider", provider)
    .maybeSingle();

  const config = (data?.config ?? {}) as Record<string, unknown>;
  const tokens = config.tokens as OAuthTokens | undefined;
  const clientId = config.clientId as string | undefined;
  const clientSecret = config.clientSecret as string | undefined;

  if (!tokens?.access_token) {
    return { error: "Nog niet geautoriseerd. Klik eerst op Autoriseren." };
  }

  let active = tokens;
  if (isTokenExpired(tokens) && tokens.refresh_token && clientId && clientSecret) {
    const refreshed = await refreshTokens(provider, {
      refreshToken: tokens.refresh_token,
      clientId,
      clientSecret,
    });
    if (!refreshed.ok) return { error: refreshed.error };
    active = refreshed.tokens;
    const now = new Date().toISOString();
    await untyped(supabase)
      .from("integraties")
      .update({
        config: { ...config, tokens: active },
        updated_at: now,
      })
      .eq("bedrijf_id", companyId)
      .eq("provider", provider);
  }

  const result = await fetchAccountName(provider, active.access_token);
  if (!result.ok) return { error: result.error };

  return { ok: true, account: result.account };
}

async function testSlackConnection(
  supabase: ReturnType<typeof untyped>,
  companyId: number,
) {
  const { data } = await supabase
    .from("integraties")
    .select("config, status")
    .eq("bedrijf_id", companyId)
    .eq("provider", "slack")
    .maybeSingle();

  if (data?.status !== "connected") {
    return { error: "Koppel eerst je Slack-workspace." };
  }

  const config = (data.config ?? {}) as Record<string, unknown>;
  const connector = resolveSlackConnectorUid(config);
  const installationId =
    typeof config.installationId === "string" ? config.installationId : undefined;

  if (!connector || !installationId) {
    return { error: "Slack-installatie ontbreekt. Koppel opnieuw je workspace." };
  }

  try {
    const token = await getToken(connector, slackTokenParams(installationId));
    const res = await fetch("https://slack.com/api/auth.test", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = (await res.json()) as {
      ok?: boolean;
      team?: string;
      error?: string;
    };
    if (!json.ok) {
      return { error: json.error ?? "Slack-auth.test mislukt." };
    }
    return { ok: true, account: json.team ?? "Slack-workspace" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Slack-test mislukt.";
    return { error: message };
  }
}
