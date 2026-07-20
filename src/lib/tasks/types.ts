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

export type TaskRow = {
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
  project_id: string | null;
  afspraak_id: number | null;
  parent_task_id: number | null;
  source: string;
  ai_generated: boolean;
  requires_approval: boolean;
  recurrence_rule_id: number | null;
  position: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type TaskListFilters = {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assignee?: string | "unassigned" | "me";
  q?: string;
  overdue?: boolean;
  aiGenerated?: boolean;
  contactId?: number;
  offerteId?: number;
  factuurId?: number;
  projectId?: string;
  dealId?: number;
  afspraakId?: number;
  labelId?: number;
  page?: number;
  pageSize?: number;
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return typeof value === "string" && (TASK_PRIORITIES as readonly string[]).includes(value);
}
