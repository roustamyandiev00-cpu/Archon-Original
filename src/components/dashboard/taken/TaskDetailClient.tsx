"use client";

import { useState, useTransition } from "react";
import {
  assignTask,
  completeTask,
  reopenTask,
  updateTask,
} from "@/app/dashboard/taken/actions";
import type { TaskRow } from "@/lib/tasks/types";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/tasks/types";

type Activity = {
  id: number;
  event_type: string;
  actor_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export default function TaskDetailClient({
  task: initial,
  activity,
  canWrite,
  addComment,
}: {
  task: TaskRow;
  activity: Activity[];
  canWrite: boolean;
  addComment: (
    taskId: number,
    body: string,
  ) => Promise<{ error?: string; comment?: unknown }>;
}) {
  const [task, setTask] = useState(initial);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/40 p-4">
        <input
          className="w-full bg-transparent text-xl font-semibold text-zinc-100 outline-none"
          value={task.title}
          disabled={!canWrite || pending}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
          onBlur={() => {
            if (!canWrite) return;
            startTransition(async () => {
              const result = await updateTask(task.id, { title: task.title });
              if (result.task) setTask(result.task);
              if (result.error) setError(result.error);
            });
          }}
        />
        <textarea
          className="min-h-[120px] w-full rounded-lg border border-white/10 bg-zinc-950 p-3 text-sm text-zinc-200"
          value={task.description ?? ""}
          disabled={!canWrite || pending}
          placeholder="Beschrijving…"
          onChange={(e) => setTask({ ...task, description: e.target.value })}
          onBlur={() => {
            if (!canWrite) return;
            startTransition(async () => {
              const result = await updateTask(task.id, {
                title: task.title,
                description: task.description,
              });
              if (result.task) setTask(result.task);
            });
          }}
        />
        <div className="flex flex-wrap gap-2">
          <select
            disabled={!canWrite}
            value={task.status}
            className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
            onChange={(e) =>
              startTransition(async () => {
                const result = await updateTask(task.id, {
                  title: task.title,
                  status: e.target.value as TaskRow["status"],
                });
                if (result.task) setTask(result.task);
              })
            }
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            disabled={!canWrite}
            value={task.priority}
            className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
            onChange={(e) =>
              startTransition(async () => {
                const result = await updateTask(task.id, {
                  title: task.title,
                  priority: e.target.value as TaskRow["priority"],
                });
                if (result.task) setTask(result.task);
              })
            }
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {canWrite && task.status !== "completed" ? (
            <button
              type="button"
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950"
              onClick={() =>
                startTransition(async () => {
                  const result = await completeTask(task.id);
                  if (result.task) setTask(result.task);
                })
              }
            >
              Voltooien
            </button>
          ) : null}
          {canWrite && task.status === "completed" ? (
            <button
              type="button"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200"
              onClick={() =>
                startTransition(async () => {
                  const result = await reopenTask(task.id);
                  if (result.task) setTask(result.task);
                })
              }
            >
              Heropenen
            </button>
          ) : null}
          {canWrite ? (
            <button
              type="button"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200"
              onClick={() =>
                startTransition(async () => {
                  const result = await assignTask(task.id, null);
                  if (result.task) setTask(result.task);
                })
              }
            >
              Toewijzing wissen
            </button>
          ) : null}
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {canWrite ? (
          <div className="space-y-2 border-t border-white/10 pt-4">
            <p className="text-sm font-medium text-zinc-300">Opmerking</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] w-full rounded-lg border border-white/10 bg-zinc-950 p-3 text-sm"
              placeholder="Schrijf een opmerking…"
            />
            <button
              type="button"
              className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900"
              onClick={() =>
                startTransition(async () => {
                  const result = await addComment(task.id, comment);
                  if (result.error) setError(result.error);
                  else setComment("");
                })
              }
            >
              Plaatsen
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-medium text-zinc-300">Activiteit</h2>
        <ul className="space-y-2 text-xs text-zinc-500">
          {activity.length === 0 ? (
            <li>Nog geen activiteit.</li>
          ) : (
            activity.map((row) => (
              <li key={row.id} className="rounded-lg border border-white/5 p-2">
                <p className="text-zinc-300">{row.event_type}</p>
                <p>{new Date(row.created_at).toLocaleString("nl-BE")}</p>
              </li>
            ))
          )}
        </ul>
        <div className="border-t border-white/10 pt-3 text-xs text-zinc-500">
          <p>
            Contact: {task.contact_id ?? "—"} · Offerte: {task.offerte_id ?? "—"} ·
            Factuur: {task.factuur_id ?? "—"}
          </p>
          <p className="mt-1">
            Deadline:{" "}
            {task.due_at
              ? new Date(task.due_at).toLocaleString("nl-BE")
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
