import {
  isTaskPriority,
  isTaskStatus,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";

export type CreateTaskInput = {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  startAt?: string | null;
  dueAt?: string | null;
  assignedToUserId?: string | null;
  contactId?: number | null;
  dealId?: number | null;
  offerteId?: number | null;
  factuurId?: number | null;
  projectId?: number | null;
  afspraakId?: number | null;
  parentTaskId?: number | null;
  source?: string;
  aiGenerated?: boolean;
  requiresApproval?: boolean;
  position?: number;
};

export type ParsedTaskInput = {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startAt: string | null;
  dueAt: string | null;
  assignedToUserId: string | null;
  contactId: number | null;
  dealId: number | null;
  offerteId: number | null;
  factuurId: number | null;
  projectId: number | null;
  afspraakId: number | null;
  parentTaskId: number | null;
  source: "manual" | "ai" | "agent" | "system" | "recurrence";
  aiGenerated: boolean;
  requiresApproval: boolean;
  position: number;
};

function optionalId(value: number | null | undefined): number | null {
  if (value == null) return null;
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  return value;
}

function optionalIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

export function parseCreateTaskInput(
  input: CreateTaskInput,
): { ok: true; data: ParsedTaskInput } | { ok: false; error: string } {
  const title = input.title?.trim() ?? "";
  if (!title) return { ok: false, error: "Titel is verplicht." };
  if (title.length > 200) return { ok: false, error: "Titel is te lang." };

  const statusRaw = input.status?.trim() || "todo";
  if (!isTaskStatus(statusRaw)) {
    return { ok: false, error: "Ongeldige status." };
  }

  const priorityRaw = input.priority?.trim() || "normal";
  if (!isTaskPriority(priorityRaw)) {
    return { ok: false, error: "Ongeldige prioriteit." };
  }

  const sourceRaw = (input.source?.trim() || "manual") as ParsedTaskInput["source"];
  if (!["manual", "ai", "agent", "system", "recurrence"].includes(sourceRaw)) {
    return { ok: false, error: "Ongeldige bron." };
  }

  return {
    ok: true,
    data: {
      title,
      description: input.description?.trim() || null,
      status: statusRaw,
      priority: priorityRaw,
      startAt: optionalIso(input.startAt),
      dueAt: optionalIso(input.dueAt),
      assignedToUserId: input.assignedToUserId?.trim() || null,
      contactId: optionalId(input.contactId),
      dealId: optionalId(input.dealId),
      offerteId: optionalId(input.offerteId),
      factuurId: optionalId(input.factuurId),
      projectId: optionalId(input.projectId),
      afspraakId: optionalId(input.afspraakId),
      parentTaskId: optionalId(input.parentTaskId),
      source: sourceRaw,
      aiGenerated: Boolean(input.aiGenerated),
      requiresApproval: Boolean(input.requiresApproval),
      position: Number.isFinite(input.position) ? Number(input.position) : 0,
    },
  };
}

export function nextOccurrenceKey(
  frequency: "daily" | "weekly" | "monthly",
  from: Date,
): string {
  const y = from.getUTCFullYear();
  const m = String(from.getUTCMonth() + 1).padStart(2, "0");
  const d = String(from.getUTCDate()).padStart(2, "0");
  if (frequency === "daily") return `${y}-${m}-${d}`;
  if (frequency === "weekly") {
    const day = from.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(from);
    monday.setUTCDate(from.getUTCDate() + mondayOffset);
    return `W${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, "0")}-${String(monday.getUTCDate()).padStart(2, "0")}`;
  }
  return `${y}-${m}`;
}

export function addRecurrenceInterval(
  from: Date,
  frequency: "daily" | "weekly" | "monthly",
  intervalCount: number,
): Date {
  const next = new Date(from);
  if (frequency === "daily") {
    next.setUTCDate(next.getUTCDate() + intervalCount);
  } else if (frequency === "weekly") {
    next.setUTCDate(next.getUTCDate() + 7 * intervalCount);
  } else {
    next.setUTCMonth(next.getUTCMonth() + intervalCount);
  }
  return next;
}
