import { AgentFleetBar } from "@/components/dashboard/AgentFleet";
import MissionOverview from "@/components/dashboard/MissionOverview";
import DashboardChartsSection from "@/components/dashboard/DashboardChartsSection";
import CompanySetupCard from "@/components/werkposts/CompanySetupCard";
import type { ActionItem } from "@/components/dashboard/ActionItems";
import type {
  AgentFleetMember,
  ChartsData,
  DoneItem,
  MissionTask,
  NovaBriefing,
} from "@/components/dashboard/mission-data";

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
    overdueFacturenCount: number;
    actionItems: ActionItem[];
    tasks: MissionTask[];
    important: MissionTask[];
    activity: DoneItem[];
    nova: NovaBriefing;
  };
  charts: ChartsData;
};

export default function DashboardHome({
  companyId,
  agentName,
  mission,
  charts,
}: DashboardHomeProps) {
  const activeAgents = mission.agents.filter((a) => a.pending > 0).length;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
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

      {!companyId && <CompanySetupCard />}

      <MissionOverview
        actionItems={mission.actionItems}
        tasks={mission.tasks}
        important={mission.important}
        activity={mission.activity}
        nova={mission.nova}
        agentName={agentName}
        isDemo={mission.isDemo}
      />

      <DashboardChartsSection charts={charts} />
    </div>
  );
}
