import { StatCard } from "@/components/dashboard/widgets";
import { AgentFleetBar, AgentFleetGrid } from "@/components/dashboard/AgentFleet";
import MissionOverview from "@/components/dashboard/MissionOverview";
import DashboardChartsSection from "@/components/dashboard/DashboardChartsSection";
import { euro } from "@/components/dashboard/mission-data";
import type { ActionItem } from "@/components/dashboard/ActionItems";
import type {
  AgentFleetMember,
  DoneItem,
  MissionTask,
  NovaBriefing,
} from "@/components/dashboard/mission-data";

const spark = (base: number) =>
  Array.from({ length: 14 }, (_, i) => ({
    v: Math.round(base + Math.sin(i / 2) * base * 0.18 + i * base * 0.03),
  }));

export type DashboardHomeProps = {
  companyId: number | null;
  agentName: string;
  mission: {
    isDemo: boolean;
    agents: AgentFleetMember[];
    offertesCount: number;
    klantenCount: number;
    gefactureerd: number;
    openstaand: number;
    actionItems: ActionItem[];
    tasks: MissionTask[];
    important: MissionTask[];
    activity: DoneItem[];
    nova: NovaBriefing;
  };
};

export default function DashboardHome({
  companyId,
  agentName,
  mission,
}: DashboardHomeProps) {
  const activeAgents = mission.agents.filter((a) => a.pending > 0).length;

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-500/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl"
        />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                Overzicht
              </h1>
              {mission.isDemo && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                  Demo
                </span>
              )}
            </div>
            <p className="mt-2 text-base leading-relaxed text-zinc-400 sm:text-lg">
              {mission.agents.length} AI-agents werken voor je
              {activeAgents > 0
                ? ` — ${activeAgents} ${activeAgents === 1 ? "heeft" : "hebben"} nu actie nodig.`
                : " — alles loopt op schema."}
            </p>
          </div>
          <AgentFleetBar agents={mission.agents} />
        </div>
      </header>

      {!companyId && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          Je account is nog niet aan een bedrijf gekoppeld. Zodra je een bedrijf
          hebt, verschijnen hier je echte cijfers.
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Kerncijfers
        </h2>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
          <StatCard
            label="Offertes deze maand"
            value={String(mission.offertesCount)}
            trend="+12%"
            icon="fileText"
            data={spark(30)}
            size="compact"
            href="/dashboard/offertes"
          />
          <StatCard
            label="Gefactureerd (maand)"
            value={euro(mission.gefactureerd)}
            trend="+8%"
            icon="euro"
            data={spark(60)}
            size="compact"
            href="/dashboard/facturen"
          />
          <StatCard
            label="Actieve klanten"
            value={String(mission.klantenCount)}
            trend="+5%"
            icon="contact"
            data={spark(20)}
            size="compact"
            href="/dashboard/contacten"
          />
          <StatCard
            label="Openstaand"
            value={euro(mission.openstaand)}
            trend="-3%"
            icon="receipt"
            data={spark(40)}
            positive={false}
            size="compact"
            href="/dashboard/facturen"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">
              AI-agents
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Klik op een agent om te chatten of een taak te geven.
            </p>
          </div>
        </div>
        <AgentFleetGrid agents={mission.agents} />
      </section>

      <MissionOverview
        actionItems={mission.actionItems}
        tasks={mission.tasks}
        important={mission.important}
        activity={mission.activity}
        nova={mission.nova}
        agentName={agentName}
        isDemo={mission.isDemo}
      />

      <DashboardChartsSection />
    </div>
  );
}
