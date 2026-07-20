import AiTokensManagement from "@/components/dashboard/admin/AiTokensManagement";
import {
  fetchCompanyTokenUsage,
  fetchTokenUsageTrend,
  getTokenUsageSummary,
} from "@/lib/admin/ai-tokens";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const metadata = { title: "AI Tokens — Admin Dashboard" };

export default async function AiTokensPage() {
  const { serviceSupabase } = await requirePlatformAdmin();

  const [companies, trend] = await Promise.all([
    fetchCompanyTokenUsage(serviceSupabase),
    fetchTokenUsageTrend(serviceSupabase),
  ]);
  const summary = getTokenUsageSummary(companies);

  return (
    <AiTokensManagement
      companies={companies}
      summary={summary}
      trend={trend}
    />
  );
}
