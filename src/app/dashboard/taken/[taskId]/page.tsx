import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardContext } from "@/components/dashboard/context";
import TaskDetailActions from "@/components/dashboard/taken/TaskDetailActions";
import { canWriteTasks } from "@/lib/tasks/types";

export const metadata: Metadata = { title: "Taak — ArchonPro" };

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId: raw } = await params;
  const taskId = Number(raw);
  if (!Number.isSafeInteger(taskId) || taskId <= 0) notFound();

  const ctx = await getDashboardContext();
  if (!ctx.user || !ctx.companyId) notFound();

  const { data: task } = await ctx.supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("company_id", ctx.companyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!task) notFound();

  const [{ data: comments }, { data: activity }, { data: role }, { data: isAdmin }] =
    await Promise.all([
      ctx.supabase
        .from("task_comments")
        .select("*")
        .eq("company_id", ctx.companyId)
        .eq("task_id", taskId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      ctx.supabase
        .from("task_activity_logs")
        .select("*")
        .eq("company_id", ctx.companyId)
        .eq("task_id", taskId)
        .order("created_at", { ascending: false })
        .limit(50),
      ctx.supabase.rpc("get_user_role_in_company", {
        p_company_id: ctx.companyId,
      }),
      ctx.supabase.rpc("is_company_admin", { p_company_id: ctx.companyId }),
    ]);

  const canWrite = !ctx.impersonating && canWriteTasks(role, Boolean(isAdmin));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/taken" className="text-sm text-sky-400 hover:text-sky-300">
          ← Terug naar taken
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">{task.title}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {task.status} · {task.priority}
          {task.due_at ? ` · deadline ${new Date(task.due_at).toLocaleString("nl-BE")}` : ""}
        </p>
      </div>

      {task.description ? (
        <section className="rounded-xl border border-white/10 bg-zinc-900/40 p-4 text-sm text-zinc-300 whitespace-pre-wrap">
          {task.description}
        </section>
      ) : null}

      <section className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
        <div>Contact: {task.contact_id ?? "—"}</div>
        <div>Offerte: {task.offerte_id ?? "—"}</div>
        <div>Factuur: {task.factuur_id ?? "—"}</div>
        <div>Project: {task.project_id ?? "—"}</div>
        <div>Deal: {task.deal_id ?? "—"}</div>
        <div>Afspraak: {task.afspraak_id ?? "—"}</div>
      </section>

      {canWrite ? <TaskDetailActions taskId={task.id} status={task.status} /> : null}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-200">Opmerkingen</h2>
        {(comments ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500">Nog geen opmerkingen.</p>
        ) : (
          <ul className="space-y-2">
            {(comments ?? []).map((c) => (
              <li key={c.id} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300">
                {c.body}
                <div className="mt-1 text-xs text-zinc-500">
                  {new Date(c.created_at).toLocaleString("nl-BE")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-200">Activiteit</h2>
        <ul className="space-y-1 text-xs text-zinc-500">
          {(activity ?? []).map((a) => (
            <li key={a.id}>
              {a.event_type} · {new Date(a.created_at).toLocaleString("nl-BE")}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
