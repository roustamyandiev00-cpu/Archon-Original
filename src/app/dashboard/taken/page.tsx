import type { Metadata } from "next";
import { getDashboardContext } from "@/components/dashboard/context";
import TakenManager from "@/components/dashboard/taken/TakenManager";
import { listTasks } from "@/app/dashboard/taken/actions";

export const metadata: Metadata = { title: "Taken — ArchonPro" };

export default async function TakenPage() {
  const ctx = await getDashboardContext();
  if (!ctx.user || !ctx.companyId) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        Log in om taken te bekijken.
      </div>
    );
  }

  const result = await listTasks({ pageSize: 100 });
  if ("error" in result && result.error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
        {result.error}
      </div>
    );
  }

  const canWrite = !ctx.impersonating;

  return (
    <TakenManager
      initialTasks={result.tasks ?? []}
      total={result.total ?? 0}
      canWrite={canWrite}
      currentUserId={ctx.user.id}
    />
  );
}
