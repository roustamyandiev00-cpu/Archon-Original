import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardContext } from "@/components/dashboard/context";
import {
  addTaskComment,
  getTask,
  getTaskActivity,
} from "@/app/dashboard/taken/actions";
import TaskDetailClient from "@/components/dashboard/taken/TaskDetailClient";

export const metadata: Metadata = { title: "Taak — ArchonPro" };

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId: rawId } = await params;
  const taskId = Number(rawId);
  if (!Number.isSafeInteger(taskId) || taskId <= 0) notFound();

  const ctx = await getDashboardContext();
  if (!ctx.user || !ctx.companyId) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        Log in om deze taak te bekijken.
      </div>
    );
  }

  const [taskResult, activityResult] = await Promise.all([
    getTask(taskId),
    getTaskActivity(taskId),
  ]);
  if ("error" in taskResult || !taskResult.task) notFound();

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/taken"
        className="text-sm text-zinc-400 hover:text-sky-300"
      >
        ← Terug naar taken
      </Link>
      <TaskDetailClient
        task={taskResult.task}
        activity={
          "activity" in activityResult ? (activityResult.activity ?? []) : []
        }
        canWrite={!ctx.impersonating}
        addComment={addTaskComment}
      />
    </div>
  );
}
