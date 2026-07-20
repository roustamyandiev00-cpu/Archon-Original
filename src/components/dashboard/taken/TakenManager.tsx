"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CheckSquare, LayoutGrid, List, Plus, Search } from "lucide-react";
import {
  assignTask,
  completeTask,
  createTask,
  moveTask,
} from "@/app/dashboard/taken/actions";
import type { TaskRow, TaskStatus } from "@/lib/tasks/types";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/tasks/types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Te doen",
  in_progress: "Bezig",
  waiting: "Wachtend",
  completed: "Klaar",
  cancelled: "Geannuleerd",
};

type Props = {
  initialTasks: TaskRow[];
  total: number;
  canWrite: boolean;
  currentUserId: string;
};

export default function TakenManager({
  initialTasks,
  total,
  canWrite,
  currentUserId,
}: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter && task.status !== statusFilter) return false;
      if (priorityFilter && task.priority !== priorityFilter) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const hay = `${task.title} ${task.description ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [tasks, q, statusFilter, priorityFilter]);

  function refreshLocal(next: TaskRow) {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === next.id);
      if (idx === -1) return [next, ...prev];
      const copy = [...prev];
      copy[idx] = next;
      return copy;
    });
  }

  function onCreate() {
    if (!canWrite || !title.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createTask({ title: title.trim() });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (result.task) {
        setTasks((prev) => [result.task!, ...prev]);
        setTitle("");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-zinc-100">
            <CheckSquare size={20} /> Taken
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {total} taken in dit bedrijf
          </p>
        </div>
        <div className="flex gap-2">
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
        <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-zinc-900/40 p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nieuwe taak…"
            className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
          <button
            type="button"
            disabled={pending || !title.trim()}
            onClick={onCreate}
            className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
          >
            <Plus size={16} /> Toevoegen
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoeken…"
            className="w-full rounded-lg border border-white/10 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Alle statussen</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Alle prioriteiten</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
          Geen taken gevonden. Maak je eerste taak aan.
        </div>
      ) : view === "list" ? (
        <div className="overflow-hidden rounded-xl border border-white/10">
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
                    <Link
                      href={`/dashboard/taken/${task.id}`}
                      className="font-medium text-zinc-100 hover:text-sky-300"
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-zinc-400">
                    {STATUS_LABEL[task.status]}
                  </td>
                  <td className="px-3 py-2 text-zinc-400">{task.priority}</td>
                  <td className="px-3 py-2 text-zinc-400">
                    {task.due_at
                      ? new Date(task.due_at).toLocaleDateString("nl-BE")
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {canWrite && task.status !== "completed" ? (
                      <button
                        type="button"
                        className="text-xs text-sky-400 hover:text-sky-300"
                        onClick={() =>
                          startTransition(async () => {
                            const result = await completeTask(task.id);
                            if (result.task) refreshLocal(result.task);
                          })
                        }
                      >
                        Voltooien
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {TASK_STATUSES.map((status) => (
            <div
              key={status}
              className="rounded-xl border border-white/10 bg-zinc-950/40 p-2"
            >
              <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                {STATUS_LABEL[status]}
              </p>
              <div className="space-y-2">
                {filtered
                  .filter((t) => t.status === status)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-white/10 bg-zinc-900/60 p-2"
                    >
                      <Link
                        href={`/dashboard/taken/${task.id}`}
                        className="text-sm font-medium text-zinc-100 hover:text-sky-300"
                      >
                        {task.title}
                      </Link>
                      {canWrite ? (
                        <select
                          className="mt-2 w-full rounded border border-white/10 bg-zinc-950 px-2 py-1 text-xs text-zinc-300"
                          value={task.status}
                          onChange={(e) => {
                            const next = e.target.value as TaskStatus;
                            startTransition(async () => {
                              const result = await moveTask(
                                task.id,
                                next,
                                task.position,
                              );
                              if (result.task) refreshLocal(result.task);
                            });
                          }}
                        >
                          {TASK_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      {canWrite && task.assigned_to_user_id !== currentUserId ? (
                        <button
                          type="button"
                          className="mt-1 text-[11px] text-zinc-500 hover:text-sky-400"
                          onClick={() =>
                            startTransition(async () => {
                              const result = await assignTask(
                                task.id,
                                currentUserId,
                              );
                              if (result.task) refreshLocal(result.task);
                            })
                          }
                        >
                          Aan mij toewijzen
                        </button>
                      ) : null}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
