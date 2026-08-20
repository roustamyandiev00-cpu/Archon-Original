export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "waiting",
  "completed",
  "cancelled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_SOURCES = [
  "manual",
  "ai",
  "agent",
  "system",
  "recurrence",
] as const;
export type TaskSource = (typeof TASK_SOURCES)[number];

export const KANBAN_COLUMNS: TaskStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "waiting",
  "completed",
];

export type TaskRecord = {
  id: number;
  company_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_at: string | null;
  due_at: string | null;
  completed_at: string | null;
  assigned_to_user_id: string | null;
  created_by_user_id: string | null;
  contact_id: number | null;
  deal_id: number | null;
  offerte_id: number | null;
  factuur_id: number | null;
  project_id: number | null;
  afspraak_id: number | null;
  parent_task_id: number | null;
  source: TaskSource;
  ai_generated: boolean;
  requires_approval: boolean;
  recurrence_rule_id: number | null;
  position: number;
  metadata: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export type TaskListFilters = {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assignee?: string | "me" | "unassigned";
  q?: string;
  overdue?: boolean;
  aiGenerated?: boolean;
  contactId?: number;
  dealId?: number;
  offerteId?: number;
  factuurId?: number;
  projectId?: number;
  afspraakId?: number;
  labelId?: number;
  page?: number;
  pageSize?: number;
};

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskPriority(value: string): value is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(value);
}

export function canWriteTasks(role: string | null | undefined, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  if (["viewer", "readonly", "read_only", "guest"].includes(normalized)) {
    return false;
  }
  return ["owner", "admin", "member"].includes(normalized);
}
