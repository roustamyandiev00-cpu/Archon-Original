import { Suspense } from "react";
import CommandCenterHub from "@/components/dashboard/CommandCenterHub";
import CompanySetupCard from "@/components/werkposts/CompanySetupCard";
import { getDashboardContext } from "@/components/dashboard/context";
import {
  assembleMissionOverview,
  fetchChartsData,
  fetchMissionCore,
} from "@/components/dashboard/mission-data";
import { loadCompanyAgents } from "@/components/dashboard/agents/storage";
import { loadUserAgentName } from "@/lib/agents/userAi";

export const metadata = { title: "Command Center — ArchonPro" };

export default async function CommandCenterPage() {
  const { supabase, user, companyId, isPreviewMode } = await getDashboardContext();

  const missionOptions = { useDemoWhenEmpty: isPreviewMode };

  const [agentName, core, agentConfig, charts] = await Promise.all([
    user ? loadUserAgentName(supabase, user.id) : Promise.resolve("Ela"),
    fetchMissionCore(supabase, companyId, missionOptions),
    loadCompanyAgents(supabase, companyId),
    fetchChartsData(supabase, companyId, missionOptions),
  ]);

  const mission = assembleMissionOverview(core, agentName, agentConfig);

  return (
    <div className="dashboard-page flex min-h-0 flex-1 flex-col space-y-2 lg:space-y-0">
      {!companyId && (
        <div className="shrink-0">
          <CompanySetupCard />
        </div>
      )}
      <div className="dashboard-page-content min-h-0 flex-1">
        <Suspense fallback={null}>
          <CommandCenterHub
            companyId={companyId}
            agentName={agentName}
            mission={mission}
            charts={charts}
            companyAgents={agentConfig}
          />
        </Suspense>
      </div>
    </div>
  );
}
