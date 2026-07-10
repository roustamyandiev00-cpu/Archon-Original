import { ArrowRight, CheckCircle2, FolderKanban, RefreshCw, Sparkles } from "lucide-react";
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
      t.kind === "offerte" ||
      t.title.toLowerCase().includes("project") ||
      t.href.includes("project"),
  );
  const hasRisks = mission.important.some(
    (t) => t.priority === "high" && t.kind === "offerte",
  );

  return (
    <div className="space-y-5">
      <DashboardPanel
        title="Project Gezondheid"
        icon={FolderKanban}
        badge={
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
            <Sparkles size={10} />
            AI
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-zinc-500 transition-colors hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-300"
              aria-label="Vernieuwen"
            >
              <RefreshCw size={14} />
            </button>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold text-orange-300">
              Alle
            </span>
          </div>
        }
      >
        <p className="mb-6 text-sm text-zinc-500">
          AI-voorspelling van deadlines, budgetrisico&apos;s en
          projectgezondheid.
        </p>

        {hasRisks ? (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm font-medium text-amber-200">
              {mission.important.length} project
              {mission.important.length > 1 ? "en" : ""} met risico
            </p>
            <ul className="mt-3 space-y-2">
              {mission.important.slice(0, 3).map((task) => (
                <li key={task.id}>
                  <Link
                    href={task.href}
                    className="flex items-center justify-between gap-2 text-sm text-zinc-300 hover:text-zinc-100"
                  >
                    <span className="truncate">{task.title}</span>
                    <ArrowRight size={14} className="shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mb-6 flex items-start gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 size={24} />
            </span>
            <div>
              <p className="text-lg font-semibold text-zinc-100">
                Alle projecten zijn gezond
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Geen risico&apos;s of kritieke projecten gevonden.
              </p>
            </div>
          </div>
        )}

        <PrimaryButton href="/dashboard/offertes/projecten">
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

      {projectTasks.length === 0 && !hasRisks && (
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
