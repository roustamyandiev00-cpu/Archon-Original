"use server";

import { revalidatePath } from "next/cache";
import { getCompanyContext } from "@/lib/company";

export async function decideAction(id: number, decision: "approve" | "reject") {
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) {
    return { error: "Geen actief bedrijf gevonden." };
  }

  const now = new Date().toISOString();
  const patch =
    decision === "approve"
      ? { status: "approved", approved_at: now, approved_by: user.id, updated_at: now }
      : { status: "rejected", rejected_at: now, rejected_by: user.id, updated_at: now };

  const { error } = await supabase
    .from("agent_actions")
    .update(patch)
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/automatisaties");
  return { ok: true };
}
