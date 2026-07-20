"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addTaskComment,
  completeTask,
  reopenTask,
  setTaskStatus,
} from "@/app/dashboard/taken/actions";
import { TASK_STATUSES } from "@/lib/tasks/types";

export default function TaskDetailActions({
  taskId,
  status,
}: {
  taskId: number;
  status: string;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/40 p-4">
      <div className="flex flex-wrap gap-2">
        {status !== "completed" ? (
          <button
            type="button"
            disabled={pending}
            className="rounded-full bg-emerald-500 px-3 py-1.5 text-sm font-medium text-zinc-950"
            onClick={() =>
              startTransition(async () => {
                const r = await completeTask(taskId);
                if ("error" in r && r.error) setError(r.error);
                refresh();
              })
            }
          >
            Voltooien
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-zinc-200"
            onClick={() =>
              startTransition(async () => {
                const r = await reopenTask(taskId);
                if ("error" in r && r.error) setError(r.error);
                refresh();
              })
            }
          >
            Heropenen
          </button>
        )}
        <select
          className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200"
          value={status}
          disabled={pending}
          onChange={(e) =>
            startTransition(async () => {
              const r = await setTaskStatus(taskId, e.target.value);
              if ("error" in r && r.error) setError(r.error);
              refresh();
            })
          }
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const r = await addTaskComment(taskId, comment);
            if ("error" in r && r.error) setError(r.error);
            else setComment("");
            refresh();
          });
        }}
      >
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Voeg een opmerking toe…"
          className="flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
        <button
          type="submit"
          disabled={pending || !comment.trim()}
          className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
        >
          Plaatsen
        </button>
      </form>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
