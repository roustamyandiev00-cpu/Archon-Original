import DashboardHub from "@/components/dashboard/DashboardHub";
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
    user ? loadUserAgentName(supabase, user.id) : Promise.resolve("Nova"),
    fetchMissionCore(supabase, companyId, missionOptions),
    loadCompanyAgents(supabase, companyId),
    fetchChartsData(supabase, companyId, missionOptions),
  ]);

  const mission = assembleMissionOverview(core, agentName, agentConfig);

  return (
    <div className="space-y-6">
      {!companyId && <CompanySetupCard />}
      <DashboardHub
        companyId={companyId}
        agentName={agentName}
        mission={mission}
        charts={charts}
        defaultView="command"
      />
    </div>
  );
}
