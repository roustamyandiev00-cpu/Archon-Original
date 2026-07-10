import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AI_CREDIT_COSTS,
  type AiCreditAction,
  starterAiCredits,
} from "@/lib/ai/config";

export type AiCreditStatus = {
  remaining: number;
  used: number;
};

/** Zorg dat elk bedrijf een credits-rij heeft (starter bij eerste gebruik). */
export async function ensureCompanyAiCredits(
  supabase: SupabaseClient,
  companyId: number,
): Promise<AiCreditStatus> {
  const { data: existing } = await supabase
    .from("company_ai_credits")
    .select("credits_remaining, credits_used")
    .eq("company_id", companyId)
    .maybeSingle();

  if (existing) {
    return {
      remaining: existing.credits_remaining ?? 0,
      used: existing.credits_used ?? 0,
    };
  }

  const starter = starterAiCredits();
  const { data: inserted, error } = await supabase
    .from("company_ai_credits")
    .insert({
      company_id: companyId,
      credits_remaining: starter,
      credits_used: 0,
      total_purchased: starter,
    })
    .select("credits_remaining, credits_used")
    .maybeSingle();

  if (error) {
    console.error("ensureCompanyAiCredits:", error.message);
    return { remaining: starter, used: 0 };
  }

  return {
    remaining: inserted?.credits_remaining ?? starter,
    used: inserted?.credits_used ?? 0,
  };
}

export async function getCompanyAiCredits(
  supabase: SupabaseClient,
  companyId: number,
): Promise<AiCreditStatus> {
  const { data } = await supabase
    .from("company_ai_credits")
    .select("credits_remaining, credits_used")
    .eq("company_id", companyId)
    .maybeSingle();

  if (!data) return { remaining: 0, used: 0 };
  return {
    remaining: data.credits_remaining ?? 0,
    used: data.credits_used ?? 0,
  };
}

/** Controleer tegoed vóór een AI-actie. */
export async function assertAiCreditsAvailable(
  supabase: SupabaseClient,
  companyId: number,
  action: AiCreditAction,
): Promise<{ ok: true } | { ok: false; error: string; remaining: number }> {
  const status = await ensureCompanyAiCredits(supabase, companyId);
  const cost = AI_CREDIT_COSTS[action];

  if (status.remaining < cost) {
    return {
      ok: false,
      error: `Onvoldoende AI-tegoed (${status.remaining} over, ${cost} nodig). Koop extra credits zodra betaling live is.`,
      remaining: status.remaining,
    };
  }

  return { ok: true };
}

/** Trek credits af na een geslaagde AI-actie. */
export async function deductAiCredits(
  supabase: SupabaseClient,
  input: {
    companyId: number;
    userId?: string | null;
    action: AiCreditAction;
    metadata?: Record<string, unknown>;
  },
): Promise<boolean> {
  const cost = AI_CREDIT_COSTS[input.action];

  const { data, error } = await supabase.rpc("deduct_ai_credits", {
    p_company_id: input.companyId,
    p_credits_needed: cost,
    p_action_type: input.action,
    p_user_id: input.userId ?? undefined,
    p_metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("deduct_ai_credits:", error.message);
    return deductAiCreditsFallback(supabase, input.companyId, cost, input);
  }

  return Boolean(data);
}

/** Directe update als RPC niet beschikbaar is (dev / migratie). */
async function deductAiCreditsFallback(
  supabase: SupabaseClient,
  companyId: number,
  cost: number,
  input: {
    userId?: string | null;
    action: AiCreditAction;
    metadata?: Record<string, unknown>;
  },
): Promise<boolean> {
  const status = await ensureCompanyAiCredits(supabase, companyId);
  if (status.remaining < cost) return false;

  const { error: updateError } = await supabase
    .from("company_ai_credits")
    .update({
      credits_remaining: status.remaining - cost,
      credits_used: status.used + cost,
    })
    .eq("company_id", companyId);

  if (updateError) {
    console.error("deductAiCreditsFallback:", updateError.message);
    return false;
  }

  await supabase.from("ai_credit_transactions").insert({
    company_id: companyId,
    type: input.action,
    amount: -cost,
    credits_before: status.remaining,
    credits_after: status.remaining - cost,
    description: `AI-actie: ${input.action}`,
  });

  return true;
}
