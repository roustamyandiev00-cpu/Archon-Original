import type { SupabaseClient } from "@supabase/supabase-js";
import { untyped } from "@/lib/integraties";

export type SendGuardResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Hard guardrails vóór automatisch versturen van een werkpost-reactie (§4.6).
 * Altijd na menselijke goedkeuring van de agent-action.
 */
export async function assertCanAutoSendReactie(
  supabase: SupabaseClient,
  input: {
    companyId: number;
    werkpostId: string;
  },
): Promise<SendGuardResult> {
  const { data: post } = await supabase
    .from("werkposts")
    .select("id, company_id, status, verloopt_op")
    .eq("id", input.werkpostId)
    .maybeSingle();

  if (!post) return { ok: false, reason: "Werkpost niet gevonden" };
  if (post.company_id === input.companyId) {
    return { ok: false, reason: "Eigen werkpost" };
  }
  if (post.status !== "open") {
    return { ok: false, reason: "Werkpost is niet open" };
  }
  if (post.verloopt_op && new Date(post.verloopt_op) < new Date()) {
    return { ok: false, reason: "Werkpost is verlopen" };
  }

  const { data: existing } = await supabase
    .from("werkpost_reacties")
    .select("id")
    .eq("werkpost_id", input.werkpostId)
    .eq("company_id", input.companyId)
    .maybeSingle();
  if (existing) {
    return { ok: false, reason: "Al gereageerd op deze werkpost (dedupe)" };
  }

  const { data: settings } = await untyped(supabase)
    .from("onderaannemer_agent_settings")
    .select("*")
    .eq("company_id", input.companyId)
    .maybeSingle();

  if (!settings?.enabled) {
    return { ok: false, reason: "Matching niet ingeschakeld" };
  }
  if (settings.auto_send_na_goedkeuring === false) {
    return { ok: false, reason: "Auto-send na goedkeuring uitgeschakeld" };
  }

  const cooldownMin = Number(settings.cooldown_minuten ?? 60);
  if (settings.last_auto_send_at && cooldownMin > 0) {
    const elapsed =
      Date.now() - new Date(settings.last_auto_send_at).getTime();
    if (elapsed < cooldownMin * 60_000) {
      return {
        ok: false,
        reason: `Wachttijd ${cooldownMin} min tussen automatische berichten`,
      };
    }
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("agent_actions")
    .select("id", { count: "exact", head: true })
    .eq("company_id", input.companyId)
    .eq("action_type", "propose_werkpost_match")
    .eq("status", "approved")
    .gte("executed_at", dayStart.toISOString());

  const maxPerDay = Number(settings.max_berichten_per_dag ?? 5);
  if ((count ?? 0) >= maxPerDay) {
    return {
      ok: false,
      reason: `Daglimiet bereikt (${maxPerDay} automatische berichten)`,
    };
  }

  return { ok: true };
}

export async function markAutoSendTimestamp(
  supabase: SupabaseClient,
  companyId: number,
) {
  await untyped(supabase)
    .from("onderaannemer_agent_settings")
    .update({
      last_auto_send_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId);
}
