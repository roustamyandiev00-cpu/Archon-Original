import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { untyped } from "@/lib/integraties";

export const ZAPIER_PROVIDER = "zapier";

export function generateZapierWebhookToken(): string {
  return randomBytes(24).toString("hex");
}

export function zapierWebhookPath(token: string): string {
  return `/api/webhooks/zapier/${token}`;
}

export function zapierWebhookUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}${zapierWebhookPath(token)}`;
}

/** Zoekt bedrijf op webhook-token (service role / inbound). */
export async function findCompanyByZapierToken(
  supabase: SupabaseClient,
  token: string,
): Promise<{ companyId: number; config: Record<string, unknown> } | null> {
  const { data } = await untyped(supabase)
    .from("integraties")
    .select("bedrijf_id, config, status")
    .eq("provider", ZAPIER_PROVIDER)
    .eq("status", "connected")
    .contains("config", { webhookToken: token })
    .maybeSingle();

  if (!data) return null;
  const row = data as {
    bedrijf_id: number;
    config: Record<string, unknown> | null;
  };
  return { companyId: row.bedrijf_id, config: row.config ?? {} };
}
