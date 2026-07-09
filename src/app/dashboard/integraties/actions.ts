"use server";

import { revalidatePath } from "next/cache";
import { getCompanyContext } from "@/lib/company";
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
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) return { error: "Geen actief bedrijf gevonden." };

  const meta = providerMeta(provider);
  if (!meta) return { error: "Onbekende provider." };

  // OAuth-providers met volledige flow: bewaar client-gegevens en zet de
  // status op "configured". De koppeling wordt "connected" na autorisatie.
  const isOAuthFlow = meta.auth === "oauth" && hasOAuth(provider);

  if (meta.auth === "peppol") {
    if (!config.accessPoint) return { error: "Kies een access point." };
    if (!config.participantId?.trim()) {
      return { error: "Vul je Peppol-identificatie in (bv. 0208:BE0123456789)." };
    }
  } else if (isOAuthFlow) {
    if (!config.clientId?.trim() || !config.clientSecret?.trim()) {
      return { error: "Vul Client ID en Client Secret in." };
    }
  } else if (!config.apiKey?.trim()) {
    return { error: "Vul de API-sleutel in." };
  }

  const now = new Date().toISOString();
  const status = isOAuthFlow ? "configured" : "connected";
  const { error } = await untyped(supabase)
    .from("integraties")
    .upsert(
      {
        bedrijf_id: companyId,
        provider,
        status,
        config,
        connected_at: isOAuthFlow ? null : now,
        updated_at: now,
      },
      { onConflict: "bedrijf_id,provider" },
    );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/integraties");
  return { ok: true, status };
}

/** Verbreekt de koppeling met een provider (config wordt gewist). */
export async function disconnectIntegration(provider: string) {
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) return { error: "Geen actief bedrijf gevonden." };

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
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) return { error: "Geen actief bedrijf gevonden." };

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
