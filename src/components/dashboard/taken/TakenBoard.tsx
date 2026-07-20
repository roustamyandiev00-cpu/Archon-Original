"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  LayoutGrid,
  List,
  Plus,
  Search,
} from "lucide-react";
import {
  completeTask,
  createTask,
  moveTask,
} from "@/app/dashboard/taken/actions";
import {
  KANBAN_COLUMNS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/tasks/types";

export type TaskRow = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  assigned_to_user_id: string | null;
  ai_generated: boolean;
  position: number;
};

const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  todo: "Te doen",
  in_progress: "Bezig",
  waiting: "Wachtend",
  completed: "Afgerond",
  cancelled: "Geannuleerd",
};

export default function TakenBoard({
  initialTasks,
  canWrite,
  currentUserId,
  nowIso,
}: {
  initialTasks: TaskRow[];
  canWrite: boolean;
  currentUserId: string;
  nowIso: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [assignee, setAssignee] = useState<string>("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [aiOnly, setAiOnly] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return initialTasks.filter((task) => {
      if (q && !`${task.title} ${task.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) {
        return false;
      }
      if (status && task.status !== status) return false;
      if (priority && task.priority !== priority) return false;
      if (assignee === "me" && task.assigned_to_user_id !== currentUserId) return false;
      if (assignee === "unassigned" && task.assigned_to_user_id) return false;
      if (overdueOnly) {
        if (!task.due_at) return false;
        if (task.due_at >= nowIso) return false;
        if (task.status === "completed" || task.status === "cancelled") return false;
      }
      if (aiOnly && !task.ai_generated) return false;
      return true;
    });
  }, [initialTasks, q, status, priority, assignee, overdueOnly, aiOnly, currentUserId, nowIso]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setError(null);
    const result = await createTask({ title, status: "todo", priority: "normal" });
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    setTitle("");
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Taken</h1>
          <p className="text-sm text-zinc-400">
            Plan opvolging, koppel CRM-objecten en houd deadlines scherp.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-lg border px-3 py-1.5 text-sm ${view === "list" ? "border-sky-500/50 bg-sky-500/10 text-sky-300" : "border-white/10 text-zinc-400"}`}
          >
            <List size={16} className="inline" /> Lijst
          </button>
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`rounded-lg border px-3 py-1.5 text-sm ${view === "kanban" ? "border-sky-500/50 bg-sky-500/10 text-sky-300" : "border-white/10 text-zinc-400"}`}
          >
            <LayoutGrid size={16} className="inline" /> Kanban
          </button>
        </div>
      </div>

      {canWrite ? (
        <form onSubmit={onCreate} className="flex flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nieuwe taak…"
            className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
          />
          <button
            type="submit"
            disabled={pending || !title.trim()}
            className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
          >
            <Plus size={16} /> Toevoegen
          </button>
        </form>
      ) : (
        <p className="text-sm text-zinc-500">Alleen-lezen: je kunt geen taken wijzigen.</p>
      )}

      {error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <label className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoeken…"
            className="rounded-lg border border-white/10 bg-zinc-900/60 py-1.5 pl-8 pr-3 text-sm text-zinc-100"
          />
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1.5 text-sm text-zinc-200"
        >
          <option value="">Alle statussen</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s] ?? s}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1.5 text-sm text-zinc-200"
        >
          <option value="">Alle prioriteiten</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1.5 text-sm text-zinc-200"
        >
          <option value="">Iedereen</option>
          <option value="me">Toegewezen aan mij</option>
          <option value="unassigned">Niet toegewezen</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
          Achterstallig
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input type="checkbox" checked={aiOnly} onChange={(e) => setAiOnly(e.target.checked)} />
          AI
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-zinc-500">
          Geen taken gevonden. {canWrite ? "Maak je eerste taak hierboven." : null}
        </div>
      ) : view === "list" ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-zinc-400">
              <tr>
                <th className="px-3 py-2">Titel</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Prioriteit</th>
                <th className="px-3 py-2">Deadline</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr key={task.id} className="border-t border-white/5">
                  <td className="px-3 py-2">
                    <Link href={`/dashboard/taken/${task.id}`} className="text-zinc-100 hover:text-sky-300">
                      {task.title}
                    </Link>
                    {task.ai_generated ? (
                      <span className="ml-2 text-xs text-violet-300">AI</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-zinc-400">{STATUS_LABEL[task.status] ?? task.status}</td>
                  <td className="px-3 py-2 text-zinc-400">{task.priority}</td>
                  <td className="px-3 py-2 text-zinc-400">
                    {task.due_at ? new Date(task.due_at).toLocaleString("nl-BE") : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {canWrite && task.status !== "completed" ? (
                      <button
                        type="button"
                        className="text-emerald-400 hover:text-emerald-300"
                        onClick={() =>
                          startTransition(async () => {
                            await completeTask(task.id);
                            refresh();
                          })
                        }
                      >
                        <CheckCircle2 size={16} className="inline" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {KANBAN_COLUMNS.map((column) => {
            const columnTasks = filtered.filter((t) => t.status === column);
            return (
              <section key={column} className="rounded-xl border border-white/10 bg-zinc-950/40 p-3">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  {STATUS_LABEL[column]} ({columnTasks.length})
                </h2>
                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <article key={task.id} className="rounded-lg border border-white/10 bg-zinc-900/70 p-3">
                      <Link href={`/dashboard/taken/${task.id}`} className="text-sm text-zinc-100 hover:text-sky-300">
                        {task.title}
                      </Link>
                      <p className="mt-1 text-xs text-zinc-500">{task.priority}</p>
                      {canWrite ? (
                        <select
                          className="mt-2 w-full rounded border border-white/10 bg-zinc-950 px-2 py-1 text-xs text-zinc-300"
                          value={task.status}
                          onChange={(e) =>
                            startTransition(async () => {
                              await moveTask(
                                task.id,
                                e.target.value as TaskStatus,
                                task.position,
                              );
                              refresh();
                            })
                          }
                        >
                          {TASK_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
