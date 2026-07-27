import type { Metadata } from "next";
import { getDashboardContext } from "@/components/dashboard/context";
import TakenBoard from "@/components/dashboard/taken/TakenBoard";
import { queryCompanyTasks } from "@/lib/tasks/query";
import { canWriteTasks } from "@/lib/tasks/types";

export const metadata: Metadata = { title: "Taken — ArchonPro" };

export default async function TakenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; overdue?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getDashboardContext();

  if (!ctx.user || !ctx.companyId) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        Log in met een actief bedrijf om taken te bekijken.
      </div>
    );
  }

  const { data: role } = await ctx.supabase.rpc("get_user_role_in_company", {
    p_company_id: ctx.companyId,
  });
  const { data: isAdmin } = await ctx.supabase.rpc("is_company_admin", {
    p_company_id: ctx.companyId,
  });

  const { data, error } = await queryCompanyTasks(ctx.supabase, ctx.companyId, {
    q: params.q,
    status: params.status as never,
    overdue: params.overdue === "1",
    userId: ctx.user.id,
    pageSize: 100,
  });

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
        Taken konden niet worden geladen.
      </div>
    );
  }

  return (
    <TakenBoard
      initialTasks={(data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        due_at: row.due_at,
        assigned_to_user_id: row.assigned_to_user_id,
        ai_generated: row.ai_generated,
        position: Number(row.position ?? 0),
      }))}
      canWrite={!ctx.impersonating && canWriteTasks(role, Boolean(isAdmin))}
      currentUserId={ctx.user.id}
      nowIso={new Date().toISOString()}
    />
  );
}
