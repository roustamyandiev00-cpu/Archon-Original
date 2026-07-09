import DashboardHome from "@/components/dashboard/DashboardHome";
import { getDashboardContext } from "@/components/dashboard/context";
import {
  assembleMissionOverview,
  fetchMissionCore,
} from "@/components/dashboard/mission-data";
import { loadCompanyAgents } from "@/components/dashboard/agents/storage";
import { loadUserAgentName } from "@/lib/agents/userAi";

export default async function DashboardPage() {
  const { supabase, user, companyId } = await getDashboardContext();

  const [agentName, core, agentConfig] = await Promise.all([
    user ? loadUserAgentName(supabase, user.id) : Promise.resolve("Nova"),
    fetchMissionCore(supabase, companyId),
    loadCompanyAgents(supabase, companyId),
  ]);

  const mission = assembleMissionOverview(core, agentName, agentConfig);

  return (
    <DashboardHome
      companyId={companyId}
      agentName={agentName}
      mission={mission}
    />
  );
}
