import AiTokensManagement from "@/components/dashboard/admin/AiTokensManagement";
import {
  fetchCompanyTokenUsage,
  getTokenUsageSummary,
} from "@/lib/admin/ai-tokens";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const metadata = { title: "AI Tokens — Admin Dashboard" };

export default async function AiTokensPage() {
  const { serviceSupabase } = await requirePlatformAdmin();

  const companies = await fetchCompanyTokenUsage(serviceSupabase);
  const summary = getTokenUsageSummary(companies);

  return <AiTokensManagement companies={companies} summary={summary} />;
}
