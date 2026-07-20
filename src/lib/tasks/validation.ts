import {
  isTaskPriority,
  isTaskStatus,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";

export type TaskInput = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  startAt?: string | null;
  dueAt?: string | null;
  assignedToUserId?: string | null;
  contactId?: number | null;
  dealId?: number | null;
  offerteId?: number | null;
  factuurId?: number | null;
  projectId?: string | null;
  afspraakId?: number | null;
  parentTaskId?: number | null;
  source?: string;
  aiGenerated?: boolean;
  requiresApproval?: boolean;
  position?: number;
};

export function parseTaskInput(
  raw: Partial<TaskInput> & { title?: string },
): { ok: true; data: TaskInput } | { ok: false; error: string } {
  const title = raw.title?.trim() ?? "";
  if (!title) return { ok: false, error: "Titel is verplicht." };
  if (title.length > 200) return { ok: false, error: "Titel is te lang." };

  const status = raw.status ?? "todo";
  if (!isTaskStatus(status)) return { ok: false, error: "Ongeldige status." };

  const priority = raw.priority ?? "normal";
  if (!isTaskPriority(priority)) return { ok: false, error: "Ongeldige prioriteit." };

  const optionalId = (value: number | null | undefined, label: string) => {
    if (value == null) return null;
    if (!Number.isSafeInteger(value) || value <= 0) {
      return { error: `Ongeldige ${label}.` } as const;
    }
    return value;
  };

  const contactId = optionalId(raw.contactId ?? null, "contact");
  if (contactId && typeof contactId === "object") return { ok: false, error: contactId.error };
  const dealId = optionalId(raw.dealId ?? null, "deal");
  if (dealId && typeof dealId === "object") return { ok: false, error: dealId.error };
  const offerteId = optionalId(raw.offerteId ?? null, "offerte");
  if (offerteId && typeof offerteId === "object") return { ok: false, error: offerteId.error };
  const factuurId = optionalId(raw.factuurId ?? null, "factuur");
  if (factuurId && typeof factuurId === "object") return { ok: false, error: factuurId.error };
  const afspraakId = optionalId(raw.afspraakId ?? null, "afspraak");
  if (afspraakId && typeof afspraakId === "object") return { ok: false, error: afspraakId.error };
  const parentTaskId = optionalId(raw.parentTaskId ?? null, "subtaak");
  if (parentTaskId && typeof parentTaskId === "object") {
    return { ok: false, error: parentTaskId.error };
  }

  return {
    ok: true,
    data: {
      title,
      description: raw.description?.trim() || null,
      status,
      priority,
      startAt: raw.startAt ?? null,
      dueAt: raw.dueAt ?? null,
      assignedToUserId: raw.assignedToUserId?.trim() || null,
      contactId: contactId as number | null,
      dealId: dealId as number | null,
      offerteId: offerteId as number | null,
      factuurId: factuurId as number | null,
      projectId: raw.projectId?.trim() || null,
      afspraakId: afspraakId as number | null,
      parentTaskId: parentTaskId as number | null,
      source: raw.source?.trim() || "manual",
      aiGenerated: Boolean(raw.aiGenerated),
      requiresApproval: Boolean(raw.requiresApproval),
      position: typeof raw.position === "number" ? raw.position : 0,
    },
  };
}
