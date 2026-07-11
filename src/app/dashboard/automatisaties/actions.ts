"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { rememberFromExecution } from "@/components/dashboard/agents/memory";
import { executeAgentAction } from "@/lib/agents/executor";
import { canApproveAction } from "@/lib/agents/policy";
import { writeAuditEntry } from "@/lib/agents/audit";
import { isExpired } from "@/lib/agents/workflow";

export async function decideAction(id: number, decision: "approve" | "reject") {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const { data: action } = await supabase
    .from("agent_actions")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!action) return { error: "Actie niet gevonden." };
  if (action.status !== "pending") {
    return { error: "Deze actie is al verwerkt." };
  }
  if (action.executed_at) {
    return { ok: true, route: action.target_route ?? undefined, actionId: id };
  }

  const payload = (action.payload_json ?? {}) as Record<string, unknown>;
  const meta = (payload._meta ?? {}) as Record<string, unknown>;
  const correlationId =
    (meta.correlationId as string | undefined) ?? `action-${id}`;

  if (decision === "approve" && isExpired(meta.expiresAt as string | undefined)) {
    await supabase
      .from("agent_actions")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
        reason: `${action.reason ?? ""} — voorstel verlopen`.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending");
    return { error: "Dit voorstel is verlopen." };
  }

  if (decision === "approve" && !canApproveAction()) {
    return { error: "Je hebt geen rechten om deze actie goed te keuren." };
  }

  const now = new Date().toISOString();
  const patch =
    decision === "approve"
      ? { status: "approved", approved_at: now, approved_by: user.id, updated_at: now }
      : { status: "rejected", rejected_at: now, rejected_by: user.id, updated_at: now };

  const { data: updated, error } = await supabase
    .from("agent_actions")
    .update(patch)
    .eq("id", id)
    .eq("company_id", companyId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!updated) {
    return { error: "Actie is al door iemand anders verwerkt." };
  }

  await writeAuditEntry(supabase, {
    tenantId: companyId,
    correlationId,
    actorType: "user",
    actorId: user.id,
    action: decision === "approve" ? "approval.approved" : "approval.rejected",
    entityType: action.target_entity_type,
    entityId: action.target_entity_id,
    metadata: { actionId: id, actionType: action.action_type },
  });

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

export async function snoozeAction(id: number, hours = 24) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const snoozeUntil = new Date(Date.now() + hours * 3_600_000).toISOString();
  const payloadPatch = { snoozedUntil: snoozeUntil };

  const { data: action } = await supabase
    .from("agent_actions")
    .select("payload_json")
    .eq("id", id)
    .eq("company_id", companyId)
    .eq("status", "pending")
    .maybeSingle();

  if (!action) return { error: "Actie niet gevonden of al verwerkt." };

  const existing = (action.payload_json ?? {}) as Record<string, unknown>;
  const meta = (existing._meta ?? {}) as Record<string, unknown>;

  await supabase
    .from("agent_actions")
    .update({
      payload_json: {
        ...existing,
        _meta: { ...meta, ...payloadPatch },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  await writeAuditEntry(supabase, {
    tenantId: companyId,
    correlationId: (meta.correlationId as string) ?? `action-${id}`,
    actorType: "user",
    actorId: user.id,
    action: "approval.snoozed",
    entityType: "agent_action",
    entityId: id,
    metadata: payloadPatch,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/automatisaties");
  return { ok: true, snoozeUntil };
}
