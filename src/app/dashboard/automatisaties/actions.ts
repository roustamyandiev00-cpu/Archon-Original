"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";

export async function decideAction(id: number, decision: "approve" | "reject") {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

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
