import type { SupabaseClient } from "@supabase/supabase-js";
import { untyped } from "@/lib/integraties";
import {
  isTokenExpired,
  refreshTokens,
  type OAuthTokens,
} from "@/lib/oauth";

export async function getIntegrationConfig(
  supabase: unknown,
  companyId: number,
  provider: string,
) {
  const { data } = await untyped(supabase)
    .from("integraties")
    .select("status, config")
    .eq("bedrijf_id", companyId)
    .eq("provider", provider)
    .maybeSingle();

  if (!data || data.status !== "connected") return null;
  return (data.config ?? {}) as Record<string, unknown>;
}

export async function saveIntegrationConfig(
  supabase: unknown,
  companyId: number,
  provider: string,
  patch: Record<string, unknown>,
) {
  const existing = await getIntegrationConfig(supabase, companyId, provider);
  if (!existing) return false;

  const { error } = await untyped(supabase)
    .from("integraties")
    .update({
      config: { ...existing, ...patch },
      updated_at: new Date().toISOString(),
    })
    .eq("bedrijf_id", companyId)
    .eq("provider", provider);

  return !error;
}

export async function getOAuthAccessToken(
  supabase: unknown,
  companyId: number,
  provider: string,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const config = await getIntegrationConfig(supabase, companyId, provider);
  if (!config) {
    return { ok: false, error: `${provider} is niet gekoppeld.` };
  }

  const tokens = config.tokens as OAuthTokens | undefined;
  const clientId = String(config.clientId ?? "");
  const clientSecret = String(config.clientSecret ?? "");

  if (!tokens?.access_token) {
    return { ok: false, error: "OAuth-tokens ontbreken. Autoriseer opnieuw." };
  }

  if (!isTokenExpired(tokens)) {
    return { ok: true, token: tokens.access_token };
  }

  if (!tokens.refresh_token || !clientId || !clientSecret) {
    return { ok: false, error: "Access token verlopen. Autoriseer opnieuw." };
  }

  const refreshed = await refreshTokens(provider, {
    refreshToken: tokens.refresh_token,
    clientId,
    clientSecret,
  });
  if (!refreshed.ok) return refreshed;

  await saveIntegrationConfig(supabase, companyId, provider, {
    tokens: refreshed.tokens,
  });

  return { ok: true, token: refreshed.tokens.access_token };
}

export async function markFactuurExported(
  supabase: unknown,
  companyId: number,
  factuurId: number,
  provider: string,
  exportId: string,
) {
  const now = new Date().toISOString();
  await untyped(supabase as SupabaseClient)
    .from("facturen")
    .update({
      accounting_export_provider: provider,
      accounting_export_id: exportId,
      accounting_exported_at: now,
      accounting_export_error: null,
      updated_at: now,
    })
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId);
}

export async function markFactuurExportError(
  supabase: unknown,
  companyId: number,
  factuurId: number,
  error: string,
) {
  const now = new Date().toISOString();
  await untyped(supabase as SupabaseClient)
    .from("facturen")
    .update({
      accounting_export_error: error.slice(0, 500),
      updated_at: now,
    })
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId);
}
