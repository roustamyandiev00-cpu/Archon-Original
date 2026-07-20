import type { SupabaseClient } from "@supabase/supabase-js";
import { untyped } from "@/lib/integraties";
import { writeAuditEntry } from "@/lib/agents/audit";
import type { TaskInput } from "@/lib/tasks/validation";

export async function assertSameCompanyLinks(
  supabase: SupabaseClient,
  companyId: number,
  links: {
    contactId?: number | null;
    offerteId?: number | null;
    factuurId?: number | null;
    parentTaskId?: number | null;
  },
): Promise<{ error?: string }> {
  const db = untyped(supabase);

  if (links.contactId) {
    const { data } = await db
      .from("customers")
      .select("id")
      .eq("id", links.contactId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (!data) return { error: "Contact behoort niet tot dit bedrijf." };
  }

  if (links.offerteId) {
    const { data } = await db
      .from("offertes")
      .select("id")
      .eq("id", links.offerteId)
      .eq("bedrijf_id", companyId)
      .maybeSingle();
    if (!data) return { error: "Offerte behoort niet tot dit bedrijf." };
  }

  if (links.factuurId) {
    const { data } = await db
      .from("facturen")
      .select("id")
      .eq("id", links.factuurId)
      .eq("bedrijf_id", companyId)
      .maybeSingle();
    if (!data) return { error: "Factuur behoort niet tot dit bedrijf." };
  }

  if (links.parentTaskId) {
    const { data } = await db
      .from("tasks")
      .select("id")
      .eq("id", links.parentTaskId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) return { error: "Bovenliggende taak niet gevonden." };
  }

  return {};
}

export function taskRowFromInput(
  companyId: number,
  userId: string,
  input: TaskInput,
) {
  return {
    company_id: companyId,
    title: input.title,
    description: input.description,
    status: input.status ?? "todo",
    priority: input.priority ?? "normal",
    start_at: input.startAt,
    due_at: input.dueAt,
    assigned_to_user_id: input.assignedToUserId,
    created_by_user_id: userId,
    contact_id: input.contactId,
    deal_id: input.dealId,
    offerte_id: input.offerteId,
    factuur_id: input.factuurId,
    project_id: input.projectId,
    afspraak_id: input.afspraakId,
    parent_task_id: input.parentTaskId,
    source: input.source ?? "manual",
    ai_generated: input.aiGenerated ?? false,
    requires_approval: input.requiresApproval ?? false,
    position: input.position ?? 0,
    completed_at:
      input.status === "completed" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
}

export async function logTaskActivity(
  supabase: SupabaseClient,
  input: {
    companyId: number;
    taskId: number;
    actorId: string;
    eventType: string;
    metadata?: Record<string, unknown>;
  },
) {
  await untyped(supabase).from("task_activity_logs").insert({
    company_id: input.companyId,
    task_id: input.taskId,
    actor_id: input.actorId,
    event_type: input.eventType,
    metadata: input.metadata ?? {},
  });

  await writeAuditEntry(supabase, {
    tenantId: input.companyId,
    correlationId: `task-${input.taskId}-${input.eventType}`,
    actorType: "user",
    actorId: input.actorId,
    action: input.eventType,
    entityType: "task",
    entityId: input.taskId,
    metadata: input.metadata,
  });
}
