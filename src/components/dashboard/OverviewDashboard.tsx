import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  Gauge,
  History,
  Plus,
  Receipt,
  Send,
  Sparkles,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import CompanySetupCard from "@/components/werkposts/CompanySetupCard";
import OverviewActionsPanel from "@/components/dashboard/OverviewActionsPanel";
import type { OverviewDashboardData } from "@/components/dashboard/overview-data";
import type { DoneItem } from "@/components/dashboard/mission-data";

const kpiIcons = {
  sky: FileText,
  amber: Receipt,
  violet: TrendingUp,
  rose: AlertTriangle,
  emerald: UserRound,
} as const;

const chipTone: Record<string, string> = {
  sky: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  violet: "border-violet-500/25 bg-violet-500/10 text-violet-300",
  rose: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
};

const kpiTone: Record<string, string> = {
  sky: "text-sky-400",
  amber: "text-amber-400",
  violet: "text-violet-400",
  rose: "text-rose-400",
  emerald: "text-emerald-400",
};

const riskTone = {
  urgent: "border-rose-500/25 bg-rose-500/[0.06]",
  attention: "border-amber-500/25 bg-amber-500/[0.05]",
  info: "border-sky-500/20 bg-sky-500/[0.04]",
  ok: "border-emerald-500/20 bg-emerald-500/[0.04]",
} as const;

const riskDot = {
  urgent: "bg-rose-500",
  attention: "bg-amber-500",
  info: "bg-sky-500",
  ok: "bg-emerald-500",
} as const;

function RecentActivityBlock({ activity }: { activity: DoneItem[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/60">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <History size={14} className="text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-100">Recente activiteit</h2>
        </div>
        <Link
          href="/dashboard/automatisaties"
          className="text-[11px] font-medium text-sky-400 hover:text-sky-300"
        >
          Meer
        </Link>
      </div>
      <div className="divide-y divide-white/5 px-4 sm:px-5">
        {activity.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            Nog geen recente activiteit.
          </p>
        ) : (
          activity.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 py-3 first:pt-4 last:pb-4"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={14} />
              </span>
              <div className="min-w-0 flex-1">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-sm text-zinc-300 transition-colors hover:text-zinc-100"
                  >
                    {item.text}
                  </Link>
                ) : (
                  <p className="text-sm text-zinc-300">{item.text}</p>
                )}
                <p className="mt-0.5 text-[11px] text-zinc-600">{item.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default function OverviewDashboard({
  data,
  companyId,
}: {
  data: OverviewDashboardData;
  companyId: number | null;
}) {
  const quickActions = [
    { label: "Offerte maken", href: "/dashboard/offertes/nieuw", icon: Plus },
    { label: "Factuur herinneren", href: "/dashboard/facturen", icon: Send },
    { label: "Lead opvolgen", href: "/dashboard/leads", icon: UserRound },
    { label: "Project bijwerken", href: "/dashboard/offertes/projecten", icon: Gauge },
  ];

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {data.kpis.map((kpi) => {
          const Icon = kpiIcons[kpi.tone];
          return (
            <div
              key={kpi.id}
              className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  {kpi.label}
                </p>
                <Icon size={14} className={kpiTone[kpi.tone]} />
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
                {kpi.value}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">{kpi.hint}</p>
            </div>
          );
        })}
      </section>

      {/* Hero */}
      <header className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Overzicht
            </p>
            <h1 className="mt-1 text-xl font-semibold text-zinc-50 sm:text-2xl">
              {data.greeting}, {data.userName}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
              {data.heroSummary}
            </p>
            {data.isDemo && (
              <span className="mt-3 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                Demo
              </span>
            )}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-zinc-950">
            <Sparkles size={20} />
          </div>
        </div>

        {data.chips.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {data.chips.map((chip) => (
              <span
                key={chip.id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${chipTone[chip.tone]}`}
              >
                <span className="font-semibold">{chip.count}</span>
                {chip.label}
              </span>
            ))}
          </div>
        )}
      </header>

      {!companyId && <CompanySetupCard />}

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <OverviewActionsPanel actions={data.actions} isDemo={data.isDemo} />
          <RecentActivityBlock activity={data.activity} />
        </div>

        <aside className="space-y-6">
          {/* Nova Command Center */}
          <section className="rounded-2xl border border-white/10 bg-zinc-900/60">
            <div className="border-b border-white/10 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-zinc-950">
                  <Bot size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    {data.agentName} — Prioriteit vandaag
                  </h2>
                  <p className="text-xs text-zinc-500">AI Command Center</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              {data.priorities.length === 0 ? (
                <p className="py-4 text-sm text-zinc-500">
                  Geen prioriteiten — alles loopt op schema.
                </p>
              ) : (
                data.priorities.map((item, index) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group block rounded-xl border border-white/8 bg-white/[0.02] p-3 transition-colors hover:border-sky-500/20 hover:bg-white/[0.04]"
                  >
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-xs font-bold text-sky-400">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-100 group-hover:text-sky-100">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">{item.detail}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
              <Link
                href="/dashboard/automatisaties"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300"
              >
                Alles bekijken
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="border-t border-white/10 px-4 py-4 sm:px-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Snelle acties
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.href + action.label}
                    href={action.href}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-sky-500/20 hover:bg-white/[0.04] hover:text-zinc-100"
                  >
                    <action.icon size={13} className="text-sky-400" />
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Risks */}
          <section className="rounded-2xl border border-white/10 bg-zinc-900/60">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3.5 sm:px-5">
              <AlertTriangle size={14} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-zinc-100">
                Aandacht nodig
              </h2>
            </div>
            <div className="space-y-2 p-4 sm:p-5">
              {data.risks.map((risk) => {
                const content = (
                  <div
                    className={`flex items-start gap-3 rounded-xl border p-3 ${riskTone[risk.severity]}`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${riskDot[risk.severity]}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-100">{risk.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{risk.detail}</p>
                    </div>
                  </div>
                );

                return risk.href ? (
                  <Link key={risk.id} href={risk.href} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={risk.id}>{content}</div>
                );
              })}
            </div>
          </section>

          {/* Financial snapshot */}
          {data.openstaand > 0 && (
            <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Wallet size={15} className="text-amber-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
                  Geld openstaand
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-zinc-50">
                € {Math.round(data.openstaand).toLocaleString("nl-BE")}
              </p>
              <Link
                href="/dashboard/facturen"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200"
              >
                Naar facturen
                <ArrowRight size={12} />
              </Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
