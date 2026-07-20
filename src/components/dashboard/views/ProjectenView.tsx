import { ArrowRight, FolderKanban } from "lucide-react";
import Link from "next/link";
import type { DashboardHomeProps } from "@/components/dashboard/DashboardHome";
import {
  DashboardPanel,
  EmptyState,
  PrimaryButton,
} from "@/components/dashboard/views/shared";

export default function ProjectenView({
  mission,
}: Pick<DashboardHomeProps, "mission">) {
  const projectTasks = [...mission.important, ...mission.tasks].filter(
    (t) =>
      t.title.toLowerCase().includes("project") ||
      t.href.includes("project"),
  );

  return (
    <div className="space-y-5 overflow-y-auto pb-4">
      <DashboardPanel
        title="Projectoverzicht"
        icon={FolderKanban}
      >
        <p className="mb-6 text-sm text-zinc-500">
          Open de projectenmodule voor de actuele status, planning, voortgang
          en documenten van je projecten.
        </p>

        <PrimaryButton href="/dashboard/offertes/projecten" className="w-auto px-6">
          <span className="inline-flex items-center gap-2">
            Alle projecten bekijken
            <ArrowRight size={14} />
          </span>
        </PrimaryButton>
      </DashboardPanel>

      {projectTasks.length > 0 && (
        <DashboardPanel title="Actieve opvolging" icon={FolderKanban}>
          <ul className="space-y-2">
            {projectTasks.slice(0, 6).map((task) => (
              <li key={task.id}>
                <Link
                  href={task.href}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.05] px-4 py-3 transition-colors hover:border-white/12 hover:bg-white/[0.02]"
                >
                  <FolderKanban size={16} className="shrink-0 text-orange-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {task.title}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {task.detail}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      task.priority === "high"
                        ? "bg-rose-500/15 text-rose-300"
                        : task.priority === "medium"
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-zinc-500/15 text-zinc-400"
                    }`}
                  >
                    {task.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </DashboardPanel>
      )}

      {projectTasks.length === 0 && (
        <DashboardPanel title="Actieve opvolging" icon={FolderKanban}>
          <EmptyState
            message="Geen actieve projectopvolging"
            detail="Zodra projecten lopen, verschijnt de opvolging hier."
            actionLabel="Projecten openen"
            actionHref="/dashboard/offertes/projecten"
          />
        </DashboardPanel>
      )}
    </div>
  );
}
