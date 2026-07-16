import Link from "next/link";
import {
  Activity,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Euro,
} from "lucide-react";
import type { DashboardHomeProps } from "@/components/dashboard/DashboardHome";
import {
  DashboardPanel,
  EmptyState,
} from "@/components/dashboard/views/shared";

function InfoTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Calendar;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 p-4">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon size={14} className="text-orange-400/80" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-zinc-200">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600">{detail}</p>
    </div>
  );
}

export default function OpvolgingView({
  mission,
}: Pick<DashboardHomeProps, "mission" | "agentName">) {
  const hasUrgent = mission.important.length > 0;
  const planningTasks = mission.tasks.filter((t) => t.kind === "opvolging");
  const deadlineTasks = [...mission.important, ...mission.tasks].filter(
    (t) => t.priority === "high" || t.priority === "medium",
  );
  const pipelineTasks = mission.tasks.filter((t) => t.kind === "opvolging");

  return (
    <div className="grid grid-cols-1 gap-5 overflow-y-auto pb-4 xl:grid-cols-[1fr_320px]">
      <DashboardPanel
        title="Vandaag"
        badge={
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              hasUrgent
                ? "bg-amber-500/15 text-amber-300"
                : "bg-emerald-500/15 text-emerald-300"
            }`}
          >
            {hasUrgent ? "Actie nodig" : "Op schema"}
          </span>
        }
      >
        <div
          className={`mb-6 flex items-start gap-4 rounded-xl border p-4 ${
            hasUrgent
              ? "border-amber-500/20 bg-amber-500/[0.04]"
              : "border-emerald-500/20 bg-emerald-500/[0.04]"
          }`}
        >
          <span
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
              hasUrgent
                ? "bg-amber-500/15 text-amber-400"
                : "bg-emerald-500/15 text-emerald-400"
            }`}
          >
            <CheckCircle2 size={24} />
          </span>
          <div>
            <p className="text-lg font-semibold text-zinc-100">
              {hasUrgent ? "Er staat werk klaar" : "Alles op schema"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              {hasUrgent
                ? mission.nova.headline
                : "Geen dringende taken of afspraken voor vandaag. Gebruik deze rustige ruimte om vooruit te plannen of opvolging af te ronden."}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <InfoTile
            label="Planning"
            icon={Calendar}
            value={
              planningTasks.length > 0
                ? `${planningTasks.length} opvolging${planningTasks.length > 1 ? "en" : ""}`
                : "Geen afspraken"
            }
            detail={
              planningTasks.length > 0
                ? "Bekijk je agenda voor de komende afspraken."
                : "Agenda is helemaal vrij voor nieuw werk."
            }
          />
          <InfoTile
            label="Taken"
            icon={Clock}
            value={
              deadlineTasks.length > 0
                ? `${deadlineTasks.length} deadline${deadlineTasks.length > 1 ? "s" : ""}`
                : "Geen deadlines"
            }
            detail={
              deadlineTasks.length > 0
                ? "Pak de meest urgente taken eerst aan."
                : "Goed moment om taken voor later deze week te bundelen."
            }
          />
          <InfoTile
            label="Cashflow"
            icon={Euro}
            value={
              mission.overdueFacturenCount > 0
                ? `${mission.overdueFacturenCount} urgente follow-up`
                : "Geen urgente follow-up"
            }
            detail={
              mission.overdueFacturenCount > 0
                ? "Stuur herinneringen voor vervallen facturen."
                : "Gebruik de ruimte om al concept-facturen te bekijken."
            }
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            href="/dashboard/agenda"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.04]"
          >
            Agenda openen
          </Link>
          <Link
            href="/dashboard/offertes"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.04]"
          >
            Offertes bekijken
          </Link>
        </div>
      </DashboardPanel>

      <aside className="space-y-4">
        <DashboardPanel title="AI Uitgevoerd" icon={Bot}>
          {mission.activity.length > 0 ? (
            <ul className="space-y-3">
              {mission.activity.slice(0, 5).map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-orange-500/10 text-orange-400">
                    <Bot size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-300">{item.text}</p>
                    <p className="text-[11px] text-zinc-600">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Bot}
              message="Nog geen AI acties"
              detail="Gebruik de AI chat om taken te starten."
            />
          )}
        </DashboardPanel>

        <DashboardPanel title="Pipeline" icon={Activity}>
          {pipelineTasks.length > 0 ? (
            <ul className="space-y-2">
              {pipelineTasks.slice(0, 4).map((task) => (
                <li key={task.id}>
                  <Link
                    href={task.href}
                    className="block rounded-lg border border-white/[0.05] px-3 py-2.5 transition-colors hover:border-white/12 hover:bg-white/[0.03]"
                  >
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {task.title}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {task.detail}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Activity}
              message="Pipeline is leeg"
              detail="Maak een offerte om de pipeline te activeren."
              actionLabel="Offerte maken"
              actionHref="/dashboard/offertes/nieuw"
            />
          )}
        </DashboardPanel>
      </aside>
    </div>
  );
}
