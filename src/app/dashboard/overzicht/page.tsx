import OverviewDashboard from "@/components/dashboard/OverviewDashboard";
import { loadOverviewDashboard } from "@/components/dashboard/overview-data";
import { getDashboardContext } from "@/components/dashboard/context";
import { loadUserAgentName, loadUserDisplayName } from "@/lib/agents/userAi";

export const metadata = { title: "Overzicht — ArchonPro" };

export default async function OverzichtPage() {
  const { supabase, user, companyId, isPreviewMode } = await getDashboardContext();

  const [agentName, userName] = await Promise.all([
    user ? loadUserAgentName(supabase, user.id) : Promise.resolve("Nova"),
    user ? loadUserDisplayName(supabase, user.id) : Promise.resolve("daar"),
  ]);

  const overview = await loadOverviewDashboard({
    supabase,
    companyId,
    userName,
    agentName,
    previewMode: isPreviewMode,
  });

  return <OverviewDashboard data={overview} companyId={companyId} />;
}
