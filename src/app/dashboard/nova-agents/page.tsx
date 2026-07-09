import AgentsManager from "@/components/dashboard/nova-agents/AgentsManager";
import {
  getDashboardContext,
  isActivePreviewMode,
} from "@/components/dashboard/context";
import { loadCompanyAgents } from "@/components/dashboard/agents/storage";

export const metadata = { title: "AI-agents — ArchonPro" };

export default async function NovaAgentsPage() {
  const { supabase, companyId } = await getDashboardContext();
  const preview = await isActivePreviewMode();
  const agents = await loadCompanyAgents(supabase, companyId);

  return <AgentsManager initialAgents={agents} readOnly={preview || !companyId} />;
}
