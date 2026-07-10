import FacturenListView from "@/components/dashboard/facturen/FacturenListView";
import { loadFacturenDashboardData } from "@/lib/facturen/load-facturen-data";

export const metadata = { title: "Facturen — ArchonPro" };

export default async function FacturenPage() {
  const { facturen, isDemo, hasCompany, stats } =
    await loadFacturenDashboardData();

  return (
    <FacturenListView
      facturen={facturen}
      isDemo={isDemo}
      hasCompany={hasCompany}
      stats={stats}
    />
  );
}
