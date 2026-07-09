import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Circle,
  Sparkles,
} from "lucide-react";
import ActionItems, { type ActionItem } from "@/components/dashboard/ActionItems";
import type {
  DoneItem,
  MissionTask,
  NovaBriefing,
} from "@/components/dashboard/mission-data";

const kindTone = {
  offerte: "bg-sky-500/12 text-sky-400",
  factuur: "bg-amber-500/12 text-amber-400",
  opvolging: "bg-indigo-500/12 text-indigo-400",
} as const;

const priorityTone = {
  high: "border-rose-500/30 bg-rose-500/[0.07]",
  medium: "border-white/10 bg-white/[0.02]",
  low: "border-white/8 bg-white/[0.015]",
} as const;

function TaskRow({ task }: { task: MissionTask }) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-4 sm:p-5 ${priorityTone[task.priority]}`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${kindTone[task.kind]}`}
      >
        {task.priority === "high" ? (
          <AlertTriangle size={18} />
        ) : (
          <Circle size={16} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-zinc-100">{task.title}</p>
        <p className="truncate text-sm text-zinc-500">{task.detail}</p>
      </div>
      <Link
        href={task.href}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-500/15 px-3 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/25"
      >
        {task.label}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export default function MissionOverview({
  actionItems,
  tasks,
  important,
  activity,
  nova,
  agentName,
  isDemo,
}: {
  actionItems: ActionItem[];
  tasks: MissionTask[];
  important: MissionTask[];
  activity: DoneItem[];
  nova: NovaBriefing;
  agentName: string;
  isDemo: boolean;
}) {
  const todoTotal = tasks.length + important.length + actionItems.length;

  return (
    <div className="space-y-6">
      {important.length > 0 && (
        <section className="rounded-3xl border border-rose-500/30 bg-rose-500/[0.06] p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-3 text-lg font-semibold text-rose-100 sm:text-xl">
              <AlertTriangle size={22} />
              Belangrijk nu
            </h2>
            <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-300">
              {important.length}
            </span>
          </div>
          <div className="space-y-3">
            {important.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:text-sm">
              Nog te doen
            </h2>
            <span className="rounded-full bg-sky-500/12 px-2.5 py-1 text-xs font-semibold text-sky-400">
              {todoTotal} openstaand
            </span>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            {actionItems.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  AI-voorstellen
                </p>
                <ActionItems items={actionItems} demoMode={isDemo} />
              </div>
            )}

            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.length > 0 && actionItems.length > 0 && (
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Jouw taken
                  </p>
                )}
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            ) : actionItems.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">
                Geen open taken — alles is afgehandeld.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/60">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:text-sm">
              {agentName} — wat ik zie
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-zinc-950">
                <Bot size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-base font-medium text-zinc-100">{nova.headline}</p>
                <ul className="mt-4 space-y-2.5">
                  {nova.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-400"
                    >
                      <Sparkles
                        size={14}
                        className="mt-0.5 shrink-0 text-sky-400/80"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <Link
                  href={nova.ctaHref}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400"
                >
                  <Sparkles size={14} />
                  {nova.ctaLabel}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/60">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Afgerond & recent
          </h2>
          <Link
            href="/dashboard/activiteit"
            className="text-[11px] font-medium text-sky-400 hover:text-sky-300"
          >
            Alle activiteit
          </Link>
        </div>
        <div className="p-4">
          {activity.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">
              Nog geen afgeronde acties om te tonen.
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 size={15} />
                  </span>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex-1 text-sm text-zinc-300 transition-colors hover:text-zinc-100"
                    >
                      {item.text}
                    </Link>
                  ) : (
                    <p className="flex-1 text-sm text-zinc-300">{item.text}</p>
                  )}
                  <span className="font-mono text-xs text-zinc-500">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
