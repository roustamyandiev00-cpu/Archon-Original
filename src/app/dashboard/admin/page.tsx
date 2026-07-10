import CeoHomeDashboard from "@/components/dashboard/admin/CeoHomeDashboard";
import { fetchCeoDashboardData } from "@/lib/admin/platform-data";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const metadata = { title: "CEO Dashboard — ArchonPro" };

export default async function AdminPage() {
  const { serviceSupabase } = await requirePlatformAdmin();
  const data = await fetchCeoDashboardData(serviceSupabase);

  return <CeoHomeDashboard data={data} live />;
}
