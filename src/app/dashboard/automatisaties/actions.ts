"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { rememberFromExecution } from "@/components/dashboard/agents/memory";
import { executeAgentAction } from "@/lib/agents/executor";

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

  if (decision === "approve") {
    const exec = await executeAgentAction({
      supabase,
      companyId,
      userId: user.id,
      actionId: id,
    });
    if ("error" in exec && exec.error) {
      return { error: exec.error };
    }

    await rememberFromExecution(supabase, {
      companyId,
      userId: user.id,
      actionId: id,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/offertes");
    revalidatePath("/dashboard/facturen");
    revalidatePath("/dashboard/geheugen");
    return {
      ok: true,
      route: exec.route,
      actionId: id,
      mailto: "mailto" in exec ? exec.mailto : undefined,
      bailiffMailto:
        "bailiffMailto" in exec ? exec.bailiffMailto : undefined,
    };
  }

  revalidatePath("/dashboard/automatisaties");
  revalidatePath("/dashboard");
  return { ok: true };
}
