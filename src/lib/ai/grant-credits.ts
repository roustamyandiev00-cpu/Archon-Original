import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Voeg AI-tegoed toe na een betaling (Stripe/webhook).
 * Roept Supabase RPC `add_ai_credits_after_payment` aan.
 */
export async function grantAiCreditsAfterPayment(
  supabase: SupabaseClient,
  input: {
    companyId: number;
    tokensToAdd: number;
    purchaseId?: string;
    amountEur?: number;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.tokensToAdd <= 0) {
    return { ok: false, error: "tokensToAdd moet positief zijn." };
  }

  const { error } = await supabase.rpc("add_ai_credits_after_payment", {
    p_company_id: input.companyId,
    p_tokens_to_add: input.tokensToAdd,
    p_purchase_id: input.purchaseId ?? undefined,
    p_amount_eur: input.amountEur ?? undefined,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
