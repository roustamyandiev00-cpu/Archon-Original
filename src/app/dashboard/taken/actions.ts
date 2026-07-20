"use server";

import { revalidatePath } from "next/cache";
import {
  getDashboardContext,
  requireAdminAccess,
  requireWriteAccess,
} from "@/components/dashboard/context";
import { untyped } from "@/lib/integraties";
import {
  assertSameCompanyLinks,
  logTaskActivity,
  taskRowFromInput,
} from "@/lib/tasks/service";
import { parseTaskInput, type TaskInput } from "@/lib/tasks/validation";
import {
  advanceRecurrenceDate,
  buildOccurrenceKey,
  type RecurrenceFrequency,
} from "@/lib/tasks/recurrence";
import {
  isTaskPriority,
  isTaskStatus,
  type TaskListFilters,
  type TaskPriority,
  type TaskRow,
  type TaskStatus,
} from "@/lib/tasks/types";

function revalidateTasks(taskId?: number) {
  revalidatePath("/dashboard/taken");
  revalidatePath("/dashboard/command-center");
  if (taskId) revalidatePath(`/dashboard/taken/${taskId}`);
}

function canWriteRole(role: string | null, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  const normalized = role?.trim().toLowerCase() ?? "";
  if (!normalized) return false;
  if (["viewer", "readonly", "read_only", "guest"].includes(normalized)) {
    return false;
  }
  return true;
}

async function requireTaskWrite() {
  const access = await requireWriteAccess();
  if ("error" in access) return access;
  if (!canWriteRole(access.role, access.isAdmin)) {
    return { error: "Je hebt geen rechten om taken te wijzigen." };
  }
  return access;
}

async function requireTaskRead() {
  const ctx = await getDashboardContext();
  if (!ctx.user || !ctx.companyId) {
    return { error: "Geen actief bedrijf gevonden." };
  }
  return {
    supabase: ctx.supabase,
    user: ctx.user,
    companyId: ctx.companyId,
  };
}

export async function listTasks(filters: TaskListFilters = {}) {
  const access = await requireTaskRead();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = untyped(supabase)
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
    const q = `%${filters.q.trim()}%`;
    query = query.or(`title.ilike.${q},description.ilike.${q}`);
  }
  if (filters.overdue) {
    query = query
      .lt("due_at", new Date().toISOString())
      .not("status", "in", '("completed","cancelled")');
  }
  if (filters.aiGenerated) query = query.eq("ai_generated", true);
  if (filters.contactId) query = query.eq("contact_id", filters.contactId);
  if (filters.offerteId) query = query.eq("offerte_id", filters.offerteId);
  if (filters.factuurId) query = query.eq("factuur_id", filters.factuurId);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.dealId) query = query.eq("deal_id", filters.dealId);
  if (filters.afspraakId) query = query.eq("afspraak_id", filters.afspraakId);

  const { data, error, count } = await query;
  if (error) return { error: error.message };
  return {
    tasks: (data ?? []) as TaskRow[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getTask(taskId: number) {
  const access = await requireTaskRead();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { data, error } = await untyped(supabase)
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Taak niet gevonden." };
  return { task: data as TaskRow };
}

export async function getTaskActivity(taskId: number) {
  const access = await requireTaskRead();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { data: task } = await untyped(supabase)
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!task) return { error: "Taak niet gevonden." };

  const { data, error } = await untyped(supabase)
    .from("task_activity_logs")
    .select("id, event_type, actor_id, metadata, created_at")
    .eq("task_id", taskId)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return { error: error.message };
  return { activity: data ?? [] };
}

export async function createTask(raw: Partial<TaskInput> & { title?: string }) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const parsed = parseTaskInput(raw);
  if (!parsed.ok) return { error: parsed.error };

  const linkCheck = await assertSameCompanyLinks(access.supabase, access.companyId, {
    contactId: parsed.data.contactId,
    offerteId: parsed.data.offerteId,
    factuurId: parsed.data.factuurId,
    parentTaskId: parsed.data.parentTaskId,
  });
  if (linkCheck.error) return { error: linkCheck.error };

  const row = taskRowFromInput(access.companyId, access.user.id, parsed.data);
  const { data, error } = await untyped(access.supabase)
    .from("tasks")
    .insert(row)
    .select("*")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Taak kon niet worden aangemaakt." };

  await logTaskActivity(access.supabase, {
    companyId: access.companyId,
    taskId: data.id,
    actorId: access.user.id,
    eventType: "task.created",
    metadata: { title: data.title, source: data.source },
  });

  revalidateTasks(data.id);
  return { task: data as TaskRow };
}

export async function updateTask(
  taskId: number,
  raw: Partial<TaskInput> & { title?: string },
) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };

  const { data: existing } = await untyped(access.supabase)
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("company_id", access.companyId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existing) return { error: "Taak niet gevonden." };

  const merged = parseTaskInput({
    title: raw.title ?? existing.title,
    description:
      raw.description !== undefined ? raw.description : existing.description,
    status: (raw.status as TaskStatus | undefined) ?? existing.status,
    priority: (raw.priority as TaskPriority | undefined) ?? existing.priority,
    startAt: raw.startAt !== undefined ? raw.startAt : existing.start_at,
    dueAt: raw.dueAt !== undefined ? raw.dueAt : existing.due_at,
    assignedToUserId:
      raw.assignedToUserId !== undefined
        ? raw.assignedToUserId
        : existing.assigned_to_user_id,
    contactId: raw.contactId !== undefined ? raw.contactId : existing.contact_id,
    dealId: raw.dealId !== undefined ? raw.dealId : existing.deal_id,
    offerteId: raw.offerteId !== undefined ? raw.offerteId : existing.offerte_id,
    factuurId: raw.factuurId !== undefined ? raw.factuurId : existing.factuur_id,
    projectId: raw.projectId !== undefined ? raw.projectId : existing.project_id,
    afspraakId:
      raw.afspraakId !== undefined ? raw.afspraakId : existing.afspraak_id,
    parentTaskId:
      raw.parentTaskId !== undefined ? raw.parentTaskId : existing.parent_task_id,
    position: raw.position !== undefined ? raw.position : existing.position,
  });
  if (!merged.ok) return { error: merged.error };

  const linkCheck = await assertSameCompanyLinks(access.supabase, access.companyId, {
    contactId: merged.data.contactId,
    offerteId: merged.data.offerteId,
    factuurId: merged.data.factuurId,
    parentTaskId: merged.data.parentTaskId,
  });
  if (linkCheck.error) return { error: linkCheck.error };

  const patch = taskRowFromInput(access.companyId, access.user.id, merged.data);
  delete (patch as { created_by_user_id?: string }).created_by_user_id;

  if (merged.data.status === "completed" && existing.status !== "completed") {
    patch.completed_at = new Date().toISOString();
  }
  if (merged.data.status !== "completed") {
    patch.completed_at = null;
  }

  const { data, error } = await untyped(access.supabase)
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .eq("company_id", access.companyId)
    .select("*")
    .maybeSingle();
  if (error) return { error: error.message };

  const eventType =
    existing.status !== merged.data.status
      ? "task.status_changed"
      : existing.assigned_to_user_id !== merged.data.assignedToUserId
        ? "task.assigned"
        : "task.updated";

  await logTaskActivity(access.supabase, {
    companyId: access.companyId,
    taskId,
    actorId: access.user.id,
    eventType,
    metadata: {
      beforeStatus: existing.status,
      afterStatus: merged.data.status,
    },
  });

  revalidateTasks(taskId);
  return { task: data as TaskRow };
}

export async function deleteTask(taskId: number) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };

  const { data, error } = await untyped(access.supabase)
    .from("tasks")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("company_id", access.companyId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Taak niet gevonden." };

  await logTaskActivity(access.supabase, {
    companyId: access.companyId,
    taskId,
    actorId: access.user.id,
    eventType: "task.deleted",
  });
  revalidateTasks();
  return { ok: true };
}

export async function restoreTask(taskId: number) {
  const access = await requireAdminAccess();
  if ("error" in access) return { error: access.error };

  const { data, error } = await untyped(access.supabase)
    .from("tasks")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("company_id", access.companyId)
    .select("*")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Taak niet gevonden." };

  await logTaskActivity(access.supabase, {
    companyId: access.companyId,
    taskId,
    actorId: access.user.id,
    eventType: "task.restored",
  });
  revalidateTasks(taskId);
  return { task: data as TaskRow };
}

export async function completeTask(taskId: number) {
  return updateTask(taskId, { status: "completed", title: undefined });
}

export async function reopenTask(taskId: number) {
  const result = await updateTask(taskId, { status: "todo", title: undefined });
  if ("task" in result && result.task) {
    const access = await requireTaskWrite();
    if (!("error" in access)) {
      await logTaskActivity(access.supabase, {
        companyId: access.companyId,
        taskId,
        actorId: access.user.id,
        eventType: "task.reopened",
      });
    }
  }
  return result;
}

export async function assignTask(taskId: number, userId: string | null) {
  return updateTask(taskId, {
    assignedToUserId: userId,
    title: undefined,
  });
}

export async function moveTask(
  taskId: number,
  status: TaskStatus,
  position: number,
) {
  if (!isTaskStatus(status)) return { error: "Ongeldige status." };
  return updateTask(taskId, { status, position, title: undefined });
}

export async function addTaskComment(taskId: number, body: string) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const text = body.trim();
  if (!text) return { error: "Opmerking is leeg." };

  const { data: task } = await untyped(access.supabase)
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("company_id", access.companyId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!task) return { error: "Taak niet gevonden." };

  const { data, error } = await untyped(access.supabase)
    .from("task_comments")
    .insert({
      company_id: access.companyId,
      task_id: taskId,
      body: text,
      created_by_user_id: access.user.id,
    })
    .select("id, body, created_at, created_by_user_id")
    .maybeSingle();
  if (error) return { error: error.message };

  await logTaskActivity(access.supabase, {
    companyId: access.companyId,
    taskId,
    actorId: access.user.id,
    eventType: "task.comment_added",
  });
  revalidateTasks(taskId);
  return { comment: data };
}

export async function deleteTaskComment(commentId: number) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };

  const { data, error } = await untyped(access.supabase)
    .from("task_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("company_id", access.companyId)
    .select("task_id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Opmerking niet gevonden." };
  revalidateTasks(data.task_id);
  return { ok: true };
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

  const { data: task } = await untyped(access.supabase)
    .from("tasks")
    .select("id")
    .eq("id", input.taskId)
    .eq("company_id", access.companyId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!task) return { error: "Taak niet gevonden." };

  if (!input.storagePath.startsWith(`${access.companyId}/`)) {
    return { error: "Ongeldig opslagpad voor dit bedrijf." };
  }

  const { data, error } = await untyped(access.supabase)
    .from("task_attachments")
    .insert({
      company_id: access.companyId,
      task_id: input.taskId,
      file_name: input.fileName,
      original_name: input.originalName,
      mime_type: input.mimeType ?? null,
      size_bytes: input.sizeBytes ?? null,
      storage_path: input.storagePath,
      storage_bucket: input.storageBucket ?? "project-files",
      uploaded_by: access.user.id,
    })
    .select("*")
    .maybeSingle();
  if (error) return { error: error.message };

  await logTaskActivity(access.supabase, {
    companyId: access.companyId,
    taskId: input.taskId,
    actorId: access.user.id,
    eventType: "task.attachment_added",
    metadata: { fileName: input.originalName },
  });
  revalidateTasks(input.taskId);
  return { attachment: data };
}

export async function removeTaskAttachment(attachmentId: string) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };

  const { data, error } = await untyped(access.supabase)
    .from("task_attachments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", attachmentId)
    .eq("company_id", access.companyId)
    .select("task_id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Bijlage niet gevonden." };
  revalidateTasks(data.task_id);
  return { ok: true };
}

export async function addTaskLabel(taskId: number, labelName: string) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const name = labelName.trim();
  if (!name) return { error: "Labelnaam is verplicht." };

  const { data: label, error: labelError } = await untyped(access.supabase)
    .from("task_labels")
    .upsert(
      { company_id: access.companyId, name },
      { onConflict: "company_id,name" },
    )
    .select("id")
    .maybeSingle();
  if (labelError) return { error: labelError.message };
  if (!label) return { error: "Label kon niet worden aangemaakt." };

  const { error } = await untyped(access.supabase)
    .from("task_label_assignments")
    .upsert({
      task_id: taskId,
      label_id: label.id,
      company_id: access.companyId,
    });
  if (error) return { error: error.message };
  revalidateTasks(taskId);
  return { ok: true, labelId: label.id };
}

export async function removeTaskLabel(taskId: number, labelId: number) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const { error } = await untyped(access.supabase)
    .from("task_label_assignments")
    .delete()
    .eq("task_id", taskId)
    .eq("label_id", labelId)
    .eq("company_id", access.companyId);
  if (error) return { error: error.message };
  revalidateTasks(taskId);
  return { ok: true };
}

export async function createTaskReminder(input: {
  taskId: number;
  remindAt: string;
  channel?: "in_app" | "email";
}) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const remindAt = new Date(input.remindAt);
  if (Number.isNaN(remindAt.getTime())) return { error: "Ongeldige reminder-tijd." };

  const idempotencyKey = `task:${input.taskId}:${remindAt.toISOString()}:${input.channel ?? "in_app"}`;
  const { data, error } = await untyped(access.supabase)
    .from("task_reminders")
    .upsert(
      {
        company_id: access.companyId,
        task_id: input.taskId,
        remind_at: remindAt.toISOString(),
        channel: input.channel ?? "in_app",
        status: "pending",
        idempotency_key: idempotencyKey,
        created_by_user_id: access.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id,idempotency_key" },
    )
    .select("*")
    .maybeSingle();
  if (error) return { error: error.message };

  await logTaskActivity(access.supabase, {
    companyId: access.companyId,
    taskId: input.taskId,
    actorId: access.user.id,
    eventType: "task.reminder_created",
    metadata: { remindAt: remindAt.toISOString() },
  });
  revalidateTasks(input.taskId);
  return { reminder: data };
}

export async function deleteTaskReminder(reminderId: number) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  const { data, error } = await untyped(access.supabase)
    .from("task_reminders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", reminderId)
    .eq("company_id", access.companyId)
    .select("task_id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Reminder niet gevonden." };
  revalidateTasks(data.task_id);
  return { ok: true };
}

export async function createRecurringTask(input: {
  title: string;
  frequency: RecurrenceFrequency;
  intervalCount?: number;
  dueAt?: string | null;
  description?: string | null;
}) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };
  if (!["daily", "weekly", "monthly"].includes(input.frequency)) {
    return { error: "Ongeldige herhaling." };
  }

  const nextRun = input.dueAt ? new Date(input.dueAt) : new Date();
  const { data: rule, error: ruleError } = await untyped(access.supabase)
    .from("task_recurrence_rules")
    .insert({
      company_id: access.companyId,
      frequency: input.frequency,
      interval_count: Math.max(1, input.intervalCount ?? 1),
      next_run_at: nextRun.toISOString(),
      created_by_user_id: access.user.id,
    })
    .select("*")
    .maybeSingle();
  if (ruleError) return { error: ruleError.message };
  if (!rule) return { error: "Herhaalregel kon niet worden aangemaakt." };

  const created = await createTask({
    title: input.title,
    description: input.description,
    dueAt: input.dueAt ?? null,
    source: "recurrence",
  });
  if ("error" in created && created.error) return created;

  if (created.task) {
    await untyped(access.supabase)
      .from("tasks")
      .update({ recurrence_rule_id: rule.id })
      .eq("id", created.task.id)
      .eq("company_id", access.companyId);

    await logTaskActivity(access.supabase, {
      companyId: access.companyId,
      taskId: created.task.id,
      actorId: access.user.id,
      eventType: "task.recurrence_created",
      metadata: { frequency: input.frequency },
    });
  }

  return { rule, task: created.task };
}

export async function generateNextRecurringTask(ruleId: number) {
  const access = await requireTaskWrite();
  if ("error" in access) return { error: access.error };

  const { data: rule } = await untyped(access.supabase)
    .from("task_recurrence_rules")
    .select("*")
    .eq("id", ruleId)
    .eq("company_id", access.companyId)
    .eq("is_active", true)
    .maybeSingle();
  if (!rule) return { error: "Actieve herhaalregel niet gevonden." };

  const runAt = rule.next_run_at ? new Date(rule.next_run_at) : new Date();
  const occurrenceKey = buildOccurrenceKey(rule.id, runAt);

  const { data: existingOcc } = await untyped(access.supabase)
    .from("task_recurrence_occurrences")
    .select("id, task_id")
    .eq("recurrence_rule_id", rule.id)
    .eq("occurrence_key", occurrenceKey)
    .maybeSingle();
  if (existingOcc) {
    return { ok: true, duplicate: true, taskId: existingOcc.task_id };
  }

  const { data: template } = await untyped(access.supabase)
    .from("tasks")
    .select("title, description, priority, assigned_to_user_id")
    .eq("company_id", access.companyId)
    .eq("recurrence_rule_id", rule.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const created = await createTask({
    title: template?.title ?? "Terugkerende taak",
    description: template?.description,
    priority: isTaskPriority(template?.priority) ? template.priority : "normal",
    assignedToUserId: template?.assigned_to_user_id ?? null,
    dueAt: runAt.toISOString(),
    source: "recurrence",
  });
  if ("error" in created && created.error) return created;

  await untyped(access.supabase).from("task_recurrence_occurrences").insert({
    company_id: access.companyId,
    recurrence_rule_id: rule.id,
    occurrence_key: occurrenceKey,
    task_id: created.task?.id ?? null,
  });

  const next = advanceRecurrenceDate(
    runAt,
    rule.frequency as RecurrenceFrequency,
    Number(rule.interval_count ?? 1),
  );
  await untyped(access.supabase)
    .from("task_recurrence_rules")
    .update({
      next_run_at: next.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", rule.id)
    .eq("company_id", access.companyId);

  return { ok: true, task: created.task };
}
