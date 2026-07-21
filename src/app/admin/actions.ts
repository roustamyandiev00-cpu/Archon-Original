"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export async function updateCompanyStatusAction(input: {
  companyId: number;
  status: "active" | "suspended" | "trial";
}) {
  const { serviceSupabase } = await requirePlatformAdmin();

  const isActive = input.status !== "suspended";
  const subscriptionStatus =
    input.status === "trial" ? "trialing" : input.status === "suspended" ? "canceled" : "active";

  const { error } = await serviceSupabase
    .from("bedrijven")
    .update({
      is_active: isActive,
      status: input.status,
      subscription_status: subscriptionStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.companyId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${input.companyId}`);

  return { ok: true as const };
}

export async function addAiCreditsAction(input: {
  companyId: number;
  amount: number;
}) {
  const { serviceSupabase } = await requirePlatformAdmin();

  const { data: current, error: readError } = await serviceSupabase
    .from("company_ai_credits")
    .select("credits_remaining, total_purchased")
    .eq("company_id", input.companyId)
    .maybeSingle();

  if (readError) {
    return { ok: false as const, error: readError.message };
  }

  if (!current) {
    const { error } = await serviceSupabase.from("company_ai_credits").insert({
      company_id: input.companyId,
      credits_remaining: input.amount,
      total_purchased: input.amount,
    });
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await serviceSupabase
      .from("company_ai_credits")
      .update({
        credits_remaining: (current.credits_remaining ?? 0) + input.amount,
        total_purchased: (current.total_purchased ?? 0) + input.amount,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", input.companyId);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath(`/admin/companies/${input.companyId}`);
  revalidatePath("/admin/ai-agents");

  return { ok: true as const };
}
