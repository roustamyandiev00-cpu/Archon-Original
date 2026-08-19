"use server";

import { revalidatePath } from "next/cache";
import {
  requireAdminAccess,
  requireWriteAccess,
} from "@/components/dashboard/context";
import { writeAuditEntry } from "@/lib/agents/audit";
import {
  assertTaskRelations,
  writeTaskActivity,
} from "@/lib/tasks/relations";
import {
  canWriteTasks,
  isTaskPriority,
  isTaskStatus,
  type TaskListFilters,
} from "@/lib/tasks/types";
import {
  addRecurrenceInterval,
  nextOccurrenceKey,
  parseCreateTaskInput,
  type CreateTaskInput,
} from "@/lib/tasks/validation";
import type { Json } from "@/types/database.types";

function revalidateTasks(taskId?: number) {
  revalidatePath("/dashboard/taken");
  revalidatePath("/dashboard/command-center");
  if (taskId) revalidatePath(`/dashboard/taken/${taskId}`);
}

async function requireTaskWrite() {
  const access = await requireWriteAccess();
  if ("error" in access) return access;
  if (!canWriteTasks(access.role, access.isAdmin)) {
    return { error: "Je hebt geen rechten om taken te wijzigen." };
  }
  return access;
}

export async function createTask(input: CreateTaskInput) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const parsed = parseCreateTaskInput(input);
  if (!parsed.ok) return { error: parsed.error };

  const relations = await assertTaskRelations(supabase, companyId, parsed.data);
  if (!relations.ok) return { error: relations.error };

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      company_id: companyId,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      start_at: parsed.data.startAt,
      due_at: parsed.data.dueAt,
      assigned_to_user_id: parsed.data.assignedToUserId,
      created_by_user_id: user.id,
      created_by: user.id,
      contact_id: parsed.data.contactId,
      deal_id: parsed.data.dealId,
      offerte_id: parsed.data.offerteId,
      factuur_id: parsed.data.factuurId,
      project_id: parsed.data.projectId,
      afspraak_id: parsed.data.afspraakId,
      parent_task_id: parsed.data.parentTaskId,
      source: parsed.data.source,
      ai_generated: parsed.data.aiGenerated,
      requires_approval: parsed.data.requiresApproval,
      position: parsed.data.position,
      metadata: {} as Json,
      completed_at:
        parsed.data.status === "completed" ? now : null,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await writeTaskActivity(supabase, {
    companyId,
    taskId: data.id,
    actorId: user.id,
    eventType: "task.created",
  });
  await writeAuditEntry(supabase, {
    tenantId: companyId,
    correlationId: `task-${data.id}`,
    actorType: "user",
    actorId: user.id,
    action: "task.created",
    entityType: "task",
    entityId: data.id,
  });

  revalidateTasks(data.id);
  return { ok: true as const, id: data.id };
}

export async function updateTask(id: number, input: CreateTaskInput) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  if (!Number.isSafeInteger(id) || id <= 0) return { error: "Ongeldige taak." };

  const parsed = parseCreateTaskInput(input);
  if (!parsed.ok) return { error: parsed.error };

  const relations = await assertTaskRelations(supabase, companyId, parsed.data);
  if (!relations.ok) return { error: relations.error };

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      start_at: parsed.data.startAt,
      due_at: parsed.data.dueAt,
      assigned_to_user_id: parsed.data.assignedToUserId,
      contact_id: parsed.data.contactId,
      deal_id: parsed.data.dealId,
      offerte_id: parsed.data.offerteId,
      factuur_id: parsed.data.factuurId,
      project_id: parsed.data.projectId,
      afspraak_id: parsed.data.afspraakId,
      parent_task_id: parsed.data.parentTaskId,
      position: parsed.data.position,
      completed_at:
        parsed.data.status === "completed" ? now : null,
      updated_at: now,
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Taak niet gevonden." };

  await writeTaskActivity(supabase, {
    companyId,
    taskId: id,
    actorId: user.id,
    eventType: "task.updated",
  });
  await writeAuditEntry(supabase, {
    tenantId: companyId,
    correlationId: `task-${id}`,
    actorType: "user",
    actorId: user.id,
    action: "task.updated",
    entityType: "task",
    entityId: id,
  });

  revalidateTasks(id);
  return { ok: true as const };
}

export async function deleteTask(id: number) {
  const access = await requireAdminAccess();
  if ("error" in access) return { error: access.error };
  if (!canWriteTasks(access.role, access.isAdmin)) {
    return { error: "Alleen beheerders kunnen taken verwijderen." };
  }
  const { supabase, companyId, user } = access;

  const { data, error } = await supabase
    .from("tasks")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Taak niet gevonden." };

  await writeTaskActivity(supabase, {
    companyId,
    taskId: id,
    actorId: user.id,
    eventType: "task.deleted",
  });
  await writeAuditEntry(supabase, {
    tenantId: companyId,
    correlationId: `task-${id}`,
    actorType: "user",
    actorId: user.id,
    action: "task.deleted",
    entityType: "task",
    entityId: id,
  });

  revalidateTasks();
  return { ok: true as const };
}

export async function restoreTask(id: number) {
  const access = await requireAdminAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const { data, error } = await supabase
    .from("tasks")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId)
    .not("deleted_at", "is", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Taak niet gevonden." };

  await writeAuditEntry(supabase, {
    tenantId: companyId,
    correlationId: `task-${id}`,
    actorType: "user",
    actorId: user.id,
    action: "task.restored",
    entityType: "task",
    entityId: id,
  });

  revalidateTasks(id);
  return { ok: true as const };
}

export async function completeTask(id: number) {
  return setTaskStatus(id, "completed");
}

export async function reopenTask(id: number) {
  return setTaskStatus(id, "todo");
}

export async function setTaskStatus(id: number, status: string) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  if (!isTaskStatus(status)) return { error: "Ongeldige status." };
  const { supabase, companyId, user } = access;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "completed" ? now : null,
      updated_at: now,
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Taak niet gevonden." };

  const action =
    status === "completed"
      ? "task.completed"
      : status === "todo"
        ? "task.reopened"
        : "task.status_changed";

  await writeTaskActivity(supabase, {
    companyId,
    taskId: id,
    actorId: user.id,
    eventType: action,
    metadata: { status },
  });
  await writeAuditEntry(supabase, {
    tenantId: companyId,
    correlationId: `task-${id}`,
    actorType: "user",
    actorId: user.id,
    action,
    entityType: "task",
    entityId: id,
    metadata: { status },
  });

  revalidateTasks(id);
  return { ok: true as const };
}

export async function assignTask(id: number, userId: string | null) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const { data, error } = await supabase
    .from("tasks")
    .update({
      assigned_to_user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Taak niet gevonden." };

  await writeAuditEntry(supabase, {
    tenantId: companyId,
    correlationId: `task-${id}`,
    actorType: "user",
    actorId: user.id,
    action: "task.assigned",
    entityType: "task",
    entityId: id,
    metadata: { assignedTo: userId },
  });

  revalidateTasks(id);
  return { ok: true as const };
}

export async function moveTask(
  id: number,
  status: string,
  position: number,
) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  if (!isTaskStatus(status)) return { error: "Ongeldige status." };
  const { supabase, companyId, user } = access;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status,
      position,
      completed_at: status === "completed" ? now : null,
      updated_at: now,
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Taak niet gevonden." };

  await writeTaskActivity(supabase, {
    companyId,
    taskId: id,
    actorId: user.id,
    eventType: "task.status_changed",
    metadata: { status, position },
  });

  revalidateTasks(id);
  return { ok: true as const };
}

export async function addTaskComment(taskId: number, body: string) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const text = body.trim();
  if (!text) return { error: "Reactie mag niet leeg zijn." };
  const { supabase, companyId, user } = access;

  const { data: task } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!task) return { error: "Taak niet gevonden." };

  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      company_id: companyId,
      task_id: taskId,
      body: text,
      created_by_user_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await writeAuditEntry(supabase, {
    tenantId: companyId,
    correlationId: `task-${taskId}`,
    actorType: "user",
    actorId: user.id,
    action: "task.comment_added",
    entityType: "task",
    entityId: taskId,
  });

  revalidateTasks(taskId);
  return { ok: true as const, id: data.id };
}

export async function deleteTaskComment(commentId: number) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { error } = await supabase
    .from("task_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("company_id", companyId)
    .is("deleted_at", null);

  if (error) return { error: error.message };
  revalidateTasks();
  return { ok: true as const };
}

export async function addTaskAttachment(input: {
  taskId: number;
  fileName: string;
  originalName: string;
  mimeType?: string;
  sizeBytes?: number;
  storagePath: string;
  storageBucket?: string;
}) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const { data: task } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", input.taskId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!task) return { error: "Taak niet gevonden." };

  if (!input.storagePath.startsWith(`${companyId}/`)) {
    return { error: "Ongeldig opslagpad voor dit bedrijf." };
  }

  const { data, error } = await supabase
    .from("task_attachments")
    .insert({
      company_id: companyId,
      task_id: input.taskId,
      file_name: input.fileName,
      original_name: input.originalName,
      mime_type: input.mimeType ?? null,
      size_bytes: input.sizeBytes ?? null,
      storage_path: input.storagePath,
      storage_bucket: input.storageBucket ?? "project-files",
      uploaded_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await writeAuditEntry(supabase, {
    tenantId: companyId,
    correlationId: `task-${input.taskId}`,
    actorType: "user",
    actorId: user.id,
    action: "task.attachment_added",
    entityType: "task",
    entityId: input.taskId,
  });

  revalidateTasks(input.taskId);
  return { ok: true as const, id: data.id };
}

export async function removeTaskAttachment(attachmentId: string) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { error } = await supabase
    .from("task_attachments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", attachmentId)
    .eq("company_id", companyId)
    .is("deleted_at", null);

  if (error) return { error: error.message };
  revalidateTasks();
  return { ok: true as const };
}

export async function addTaskLabel(taskId: number, labelName: string, color?: string) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const name = labelName.trim();
  if (!name) return { error: "Labelnaam is verplicht." };
  const { supabase, companyId } = access;

  const { data: label, error: labelError } = await supabase
    .from("task_labels")
    .upsert(
      {
        company_id: companyId,
        name,
        color: color?.trim() || "#64748b",
      },
      { onConflict: "company_id,name" },
    )
    .select("id")
    .single();

  if (labelError) return { error: labelError.message };

  const { error } = await supabase.from("task_label_assignments").upsert({
    company_id: companyId,
    task_id: taskId,
    label_id: label.id,
  });

  if (error) return { error: error.message };
  revalidateTasks(taskId);
  return { ok: true as const, labelId: label.id };
}

export async function removeTaskLabel(taskId: number, labelId: number) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { error } = await supabase
    .from("task_label_assignments")
    .delete()
    .eq("company_id", companyId)
    .eq("task_id", taskId)
    .eq("label_id", labelId);

  if (error) return { error: error.message };
  revalidateTasks(taskId);
  return { ok: true as const };
}

export async function createTaskReminder(input: {
  taskId: number;
  remindAt: string;
  channel?: "in_app" | "email";
}) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const remindAt = Date.parse(input.remindAt);
  if (Number.isNaN(remindAt)) return { error: "Ongeldige reminderdatum." };
  const { supabase, companyId, user } = access;

  const iso = new Date(remindAt).toISOString();
  const idempotencyKey = `task:${input.taskId}:remind:${iso}:${input.channel ?? "in_app"}`;

  const { data, error } = await supabase
    .from("task_reminders")
    .upsert(
      {
        company_id: companyId,
        task_id: input.taskId,
        remind_at: iso,
        channel: input.channel ?? "in_app",
        status: "pending",
        idempotency_key: idempotencyKey,
        created_by_user_id: user.id,
      },
      { onConflict: "company_id,idempotency_key", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };

  await writeAuditEntry(supabase, {
    tenantId: companyId,
    correlationId: `task-${input.taskId}`,
    actorType: "user",
    actorId: user.id,
    action: "task.reminder_created",
    entityType: "task",
    entityId: input.taskId,
  });

  revalidateTasks(input.taskId);
  return { ok: true as const, id: data?.id ?? null, idempotencyKey };
}

export async function deleteTaskReminder(reminderId: number) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { error } = await supabase
    .from("task_reminders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", reminderId)
    .eq("company_id", companyId);

  if (error) return { error: error.message };
  revalidateTasks();
  return { ok: true as const };
}

export async function createRecurringTask(input: {
  task: CreateTaskInput;
  frequency: "daily" | "weekly" | "monthly";
  intervalCount?: number;
  timezone?: string;
  endsAt?: string | null;
}) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const intervalCount = Math.max(1, input.intervalCount ?? 1);
  const { data: rule, error: ruleError } = await supabase
    .from("task_recurrence_rules")
    .insert({
      company_id: companyId,
      frequency: input.frequency,
      interval_count: intervalCount,
      timezone: input.timezone ?? "Europe/Brussels",
      next_run_at: new Date().toISOString(),
      ends_at: input.endsAt ?? null,
      is_active: true,
      created_by_user_id: user.id,
    })
    .select("id")
    .single();

  if (ruleError) return { error: ruleError.message };

  const created = await createTask({
    ...input.task,
    source: "recurrence",
  });
  if ("error" in created && created.error) return created;

  if (created.ok && created.id) {
    await supabase
      .from("tasks")
      .update({ recurrence_rule_id: rule.id })
      .eq("id", created.id)
      .eq("company_id", companyId);

    await writeAuditEntry(supabase, {
      tenantId: companyId,
      correlationId: `task-${created.id}`,
      actorType: "user",
      actorId: user.id,
      action: "task.recurrence_created",
      entityType: "task",
      entityId: created.id,
      metadata: { frequency: input.frequency, intervalCount },
    });
  }

  return { ok: true as const, ruleId: rule.id, taskId: created.ok ? created.id : null };
}

export async function generateNextRecurringTask(ruleId: number) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const { data: rule } = await supabase
    .from("task_recurrence_rules")
    .select("*")
    .eq("id", ruleId)
    .eq("company_id", companyId)
    .eq("is_active", true)
    .maybeSingle();

  if (!rule) return { error: "Recurrenceregel niet gevonden." };

  const frequency = rule.frequency as "daily" | "weekly" | "monthly";
  const base = rule.next_run_at ? new Date(rule.next_run_at) : new Date();
  const occurrenceKey = nextOccurrenceKey(frequency, base);

  const { data: existing } = await supabase
    .from("task_recurrence_occurrences")
    .select("id, task_id")
    .eq("recurrence_rule_id", ruleId)
    .eq("occurrence_key", occurrenceKey)
    .maybeSingle();

  if (existing) {
    return { ok: true as const, duplicate: true, taskId: existing.task_id };
  }

  const { data: template } = await supabase
    .from("tasks")
    .select("*")
    .eq("company_id", companyId)
    .eq("recurrence_rule_id", ruleId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!template) return { error: "Geen sjabloontaak voor deze recurrence." };

  const created = await createTask({
    title: template.title,
    description: template.description ?? undefined,
    status: "todo",
    priority: isTaskPriority(template.priority) ? template.priority : "normal",
    assignedToUserId: template.assigned_to_user_id,
    contactId: template.contact_id,
    dealId: template.deal_id,
    offerteId: template.offerte_id,
    factuurId: template.factuur_id,
    projectId: template.project_id,
    afspraakId: template.afspraak_id,
    source: "recurrence",
  });

  if (!created.ok || !created.id) return created;

  await supabase.from("task_recurrence_occurrences").insert({
    company_id: companyId,
    recurrence_rule_id: ruleId,
    occurrence_key: occurrenceKey,
    task_id: created.id,
  });

  const next = addRecurrenceInterval(base, frequency, rule.interval_count);
  await supabase
    .from("task_recurrence_rules")
    .update({
      next_run_at: next.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ruleId)
    .eq("company_id", companyId);

  await writeAuditEntry(supabase, {
    tenantId: companyId,
    correlationId: `task-${created.id}`,
    actorType: "user",
    actorId: user.id,
    action: "task.created",
    entityType: "task",
    entityId: created.id,
    metadata: { recurrence: true, occurrenceKey },
  });

  return { ok: true as const, taskId: created.id, occurrenceKey };
}

export async function listTasks(filters: TaskListFilters = {}) {
  const access = await requireWriteAccess();
  if ("error" in access) {
    // read-only members may still list via getDashboardContext path — use soft deny
    return { error: access.error };
  }
  const { supabase, companyId, user } = access;

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("tasks")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("position", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false })
    .range(from, to);

  if (filters.status) {
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : [filters.status];
    query = query.in("status", statuses);
  }
  if (filters.priority) {
    const priorities = Array.isArray(filters.priority)
      ? filters.priority
      : [filters.priority];
    query = query.in("priority", priorities);
  }
  if (filters.assignee === "me") {
    query = query.eq("assigned_to_user_id", user.id);
  } else if (filters.assignee === "unassigned") {
    query = query.is("assigned_to_user_id", null);
  } else if (filters.assignee) {
    query = query.eq("assigned_to_user_id", filters.assignee);
  }
  if (filters.q?.trim()) {
    query = query.or(
      `title.ilike.%${filters.q.trim()}%,description.ilike.%${filters.q.trim()}%`,
    );
  }
  if (filters.overdue) {
    query = query
      .lt("due_at", new Date().toISOString())
      .neq("status", "completed")
      .neq("status", "cancelled");
  }
  if (filters.aiGenerated) query = query.eq("ai_generated", true);
  if (filters.contactId) query = query.eq("contact_id", filters.contactId);
  if (filters.dealId) query = query.eq("deal_id", filters.dealId);
  if (filters.offerteId) query = query.eq("offerte_id", filters.offerteId);
  if (filters.factuurId) query = query.eq("factuur_id", filters.factuurId);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.afspraakId) query = query.eq("afspraak_id", filters.afspraakId);

  const { data, error, count } = await query;
  if (error) return { error: error.message };

  return {
    ok: true as const,
    tasks: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getTask(id: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Taak niet gevonden." };
  return { ok: true as const, task: data };
}

export async function getTaskActivity(taskId: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { data, error } = await supabase
    .from("task_activity_logs")
    .select("*")
    .eq("company_id", companyId)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { error: error.message };
  return { ok: true as const, activity: data ?? [] };
}
