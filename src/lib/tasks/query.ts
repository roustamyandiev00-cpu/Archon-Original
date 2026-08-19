import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { TaskListFilters } from "@/lib/tasks/types";

type Client = SupabaseClient<Database>;

export async function queryCompanyTasks(
  supabase: Client,
  companyId: number,
  filters: TaskListFilters & { userId?: string } = {},
) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 50));
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
  if (filters.assignee === "me" && filters.userId) {
    query = query.eq("assigned_to_user_id", filters.userId);
  } else if (filters.assignee === "unassigned") {
    query = query.is("assigned_to_user_id", null);
  } else if (filters.assignee) {
    query = query.eq("assigned_to_user_id", filters.assignee);
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim().replace(/[%(),]/g, "");
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
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

  return query;
}
