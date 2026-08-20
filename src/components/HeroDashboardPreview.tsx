import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  Crosshair,
  Receipt,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { BrandLockup } from "@/components/BrandLogo";
import AgentPortrait from "@/components/dashboard/agents/AgentPortrait";
import { DEFAULT_BUILTIN_AVATARS } from "@/lib/agents/avatar-options";
import { DEMO_DASHBOARD } from "@/lib/demo";
import { TRIAL_DAYS } from "@/components/dashboard/trial";

const agents = [
  {
    id: "nova",
    name: "Lara",
    role: "AI-metgezel",
    gradient: "from-sky-400 to-indigo-500",
    avatarUrl: DEFAULT_BUILTIN_AVATARS.nova,
    proactive: "4 voorstellen wacht op goedkeuring",
    open: 4,
    recent: 1,
    lastAction: "Payment reminder sent to Keukens Peeters",
    status: "Actief",
  },
  {
    id: "schatter",
    name: "Viktor",
    role: "Offertes",
    gradient: "from-violet-400 to-purple-500",
    avatarUrl: DEFAULT_BUILTIN_AVATARS.schatter,
    proactive: "1 offerte vraagt opvolging of afronding",
    open: 1,
    recent: 2,
    lastAction: "Concept-offerte klaargezet voor Wouters Dakwerken",
    status: "Actief",
  },
  {
    id: "facturatie",
    name: "Nina",
    role: "Peppol",
    gradient: "from-amber-400 to-orange-500",
    avatarUrl: DEFAULT_BUILTIN_AVATARS.facturatie,
    proactive: "2 facturen open — herinner of factureer door",
    open: 2,
    recent: 1,
    lastAction: "Peppol-factuur gecontroleerd voor Yannova BV",
    status: "Actief",
  },
  {
    id: "opvolger",
    name: "Daan",
    role: "Leads",
    gradient: "from-emerald-400 to-teal-500",
    avatarUrl: DEFAULT_BUILTIN_AVATARS.opvolger,
    proactive: "1 lead wacht op jouw volgende stap",
    open: 1,
    recent: 1,
    lastAction: "Lead Renovatie Vandenberghe verrijkt",
    status: "Actief",
  },
];

const kpis = [
  {
    label: "Offertes deze maand",
    value: String(DEMO_DASHBOARD.offertesCount),
    hint: "↑ vs vorige week",
    tone: "text-sky-400",
    spark: [4, 5, 4, 6, 5, 7, 7],
    sparkColor: "#38bdf8",
  },
  {
    label: "Gefactureerd",
    value: "€ 18,6k",
    hint: "↑ deze maand",
    tone: "text-emerald-400",
    spark: [12, 14, 13, 15, 16, 17, 18.6],
    sparkColor: "#34d399",
  },
  {
    label: "Actieve klanten",
    value: String(DEMO_DASHBOARD.klantenCount),
    hint: "+3 deze maand",
    tone: "text-violet-400",
    spark: [18, 19, 20, 21, 22, 23, 24],
    sparkColor: "#a78bfa",
  },
  {
    label: "Openstaand",
    value: "€ 7,4k",
    hint: "↓ innen prioriteit",
    tone: "text-rose-400",
    spark: [9.2, 8.8, 8.1, 7.9, 7.6, 7.5, 7.4],
    sparkColor: "#fb7185",
  },
];

const views = [
  { label: "Command Center", active: true },
  { label: "Opvolging", active: false },
  { label: "Financiën", active: false },
  { label: "Projecten", active: false },
  { label: "AI Crew", active: false },
];

const navGroups = [
  {
    title: "Operatie",
    items: [
      { label: "Contacten" },
      { label: "Offertes" },
      { label: "Facturen", badge: "3" },
      { label: "Leads / CRM", badge: "5" },
      { label: "Automatisaties" },
    ],
  },
  {
    title: "AI",
    items: [
      { label: "Nova-agents", active: true },
      { label: "Comms" },
      { label: "Geheugen" },
    ],
  },
];

function Sparkline({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const w = 56;
  const h = 22;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0 opacity-80"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function HeroDashboardPreview() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#070b12] shadow-[0_24px_60px_rgba(14,165,233,0.28)] sm:rounded-2xl sm:shadow-[0_32px_80px_rgba(14,165,233,0.32)]">
      <div className="flex min-h-0 sm:min-h-[460px] lg:min-h-[500px]">
        {/* Mini sidebar — tablet+ */}
        <aside className="hidden w-[148px] shrink-0 flex-col border-r border-white/[0.06] bg-zinc-950/80 px-2.5 py-3 md:flex">
          <BrandLockup markSize={22} wordmarkSize="sm" className="px-1" />

          <div className="mt-4 flex-1 space-y-3 overflow-hidden">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-2 text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                  {group.title}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {group.items.map((item) => (
                    <li
                      key={item.label}
                      className={`flex items-center justify-between rounded-md px-2 py-1 text-[10px] ${
                        "active" in item && item.active
                          ? "bg-sky-500/15 font-medium text-sky-300"
                          : "text-zinc-500"
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {"badge" in item && item.badge && (
                        <span className="rounded-full bg-white/8 px-1 text-[8px] text-zinc-400">
                          {item.badge}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-2 rounded-lg bg-sky-500 px-2 py-1.5 text-center text-[9px] font-semibold text-zinc-950">
            Start {TRIAL_DAYS} dagen gratis
          </div>
        </aside>

        {/* Main panel */}
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-hidden">
          {/* Mobiele navigatie-chips */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-white/[0.06] bg-zinc-950/80 px-3 py-2 [scrollbar-width:none] md:hidden">
            {["Offertes", "Facturen", "Leads", "AI-agents"].map((item, i) => (
              <span
                key={item}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  i === 3
                    ? "bg-sky-500/15 text-sky-300"
                    : "bg-white/[0.04] text-zinc-500"
                }`}
              >
                {item}
              </span>
            ))}
          </div>

          {/* View tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-white/[0.06] bg-zinc-900/60 px-2 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Crosshair size={11} className="mr-1 hidden shrink-0 text-zinc-600 sm:block" />
            {views.map((view) => (
              <span
                key={view.label}
                className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-medium sm:text-[10px] ${
                  view.active
                    ? "border border-orange-500/40 bg-orange-500/10 text-orange-300"
                    : "text-zinc-500"
                }`}
              >
                <span className="sm:hidden">
                  {view.label === "Command Center"
                    ? "Command"
                    : view.label.split(" ")[0]}
                </span>
                <span className="hidden sm:inline">{view.label}</span>
              </span>
            ))}
          </div>

          <div className="space-y-2 p-2 sm:space-y-2.5 sm:p-3">
            {/* Header */}
            <div className="rounded-lg border border-white/[0.06] bg-zinc-900/70 px-2.5 py-2 sm:rounded-xl sm:px-3 sm:py-2.5">
              <p className="text-[9px] font-medium uppercase tracking-wide text-zinc-500 sm:text-[10px]">
                Command Center
              </p>
              <p className="mt-0.5 text-[11px] font-semibold leading-snug text-zinc-100 sm:text-xs md:text-sm">
                Vier AI-agents werken voor je
                <span className="hidden sm:inline">
                  {" "}
                  — zie wat klaar is en wat nog moet
                </span>
              </p>
            </div>

            {/* Agent fleet — horizontaal scroll op mobiel */}
            <div className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain px-0.5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-1.5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="relative w-[min(148px,78vw)] shrink-0 overflow-hidden rounded-lg border border-white/[0.06] bg-zinc-900/70 p-2 sm:w-auto sm:rounded-xl sm:p-2.5"
                >
                  <div
                    className={`pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full bg-gradient-to-br ${agent.gradient} opacity-10 blur-xl`}
                  />
                  <div className="relative flex items-start gap-2">
                    <AgentPortrait
                      name={agent.name}
                      gradient={agent.gradient}
                      avatarUrl={agent.avatarUrl}
                      size="sm"
                      showNovaIcon={agent.id === "nova"}
                      className="h-8 w-8 rounded-lg sm:h-9 sm:w-9"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-zinc-100 sm:text-xs">
                        {agent.name}
                      </p>
                      <p className="truncate text-[9px] text-zinc-500">
                        {agent.role}
                      </p>
                    </div>
                    <span className="flex items-center gap-0.5 text-[8px] text-emerald-400 max-[360px]:hidden">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {agent.status}
                    </span>
                  </div>
                  <p className="relative mt-2 line-clamp-2 text-[9px] leading-relaxed text-zinc-400 sm:text-[10px]">
                    {agent.proactive}
                  </p>
                  <div className="relative mt-2 flex items-center gap-2 text-[8px] text-zinc-500 sm:text-[9px]">
                    <span>
                      <span className="font-semibold text-zinc-300">
                        {agent.open}
                      </span>{" "}
                      open
                    </span>
                    <span>
                      <span className="font-semibold text-zinc-300">
                        {agent.recent}
                      </span>{" "}
                      recent
                    </span>
                  </div>
                  <p className="relative mt-1.5 hidden truncate border-t border-white/[0.05] pt-1.5 text-[8px] text-zinc-600 sm:block">
                    {agent.lastAction}
                  </p>
                </div>
              ))}
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:grid-cols-4">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl border border-white/[0.06] bg-zinc-900/70 p-2 sm:p-2.5"
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[8px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-[9px]">
                      <span className="line-clamp-2">{kpi.label}</span>
                    </p>
                    <Sparkline values={kpi.spark} color={kpi.sparkColor} />
                  </div>
                  <p className="mt-1 text-base font-semibold tabular-nums text-zinc-50 sm:text-lg">
                    {kpi.value}
                  </p>
                  <p className={`mt-0.5 text-[8px] sm:text-[9px] ${kpi.tone}`}>
                    {kpi.hint}
                  </p>
                </div>
              ))}
            </div>

            {/* Belangrijk nu */}
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.06] p-2.5 sm:p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold text-rose-200 sm:text-xs">
                  <AlertTriangle size={12} />
                  Belangrijk nu
                </p>
                <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[8px] font-semibold text-rose-300">
                  1
                </span>
              </div>
              <div className="mt-2 flex flex-col gap-2 rounded-lg border border-rose-500/15 bg-zinc-950/40 px-2.5 py-2 sm:flex-row sm:items-center">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-500/12 text-amber-400">
                  <Receipt size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-zinc-100 sm:text-xs">
                    Factuur FAC-2026-0007 vervallen
                  </p>
                  <p className="text-[9px] text-zinc-500">
                    Keukens Peeters · € 3.120,75
                  </p>
                </div>
                <span className="inline-flex w-full shrink-0 items-center justify-center gap-0.5 rounded-md bg-sky-500/15 px-2 py-1.5 text-[9px] font-medium text-sky-300 sm:w-auto sm:py-1">
                  Openen
                  <ArrowRight size={9} />
                </span>
              </div>
            </div>

            {/* Bottom tabs hint */}
            <div className="hidden flex-wrap items-center gap-2 border-t border-white/[0.05] pt-2 text-[8px] text-zinc-600 sm:flex sm:text-[9px]">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/8 px-2 py-0.5">
                <Bot size={9} />
                NOG TE DOEN · 8 open
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/5 px-2 py-0.5 text-sky-400/80">
                <Sparkles size={9} />
                LIMA — WAT IK ZIE
              </span>
              <span className="inline-flex items-center gap-1 text-zinc-500">
                <Calendar size={9} />
                Vandaag 0 afspraken
              </span>
              <span className="inline-flex items-center gap-1 text-zinc-500">
                <Wallet size={9} />
                <TrendingUp size={9} />
                Pipeline actief
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
