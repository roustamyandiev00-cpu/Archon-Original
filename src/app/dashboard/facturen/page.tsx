import FacturenView from "@/components/dashboard/facturen/FacturenView";
import { loadFacturenDashboardData } from "@/lib/facturen/load-facturen-data";

export const metadata = { title: "Facturen — ArchonPro" };

export default async function FacturenPage() {
  const { facturen, facturenError, isDemo, hasCompany } =
    await loadFacturenDashboardData();

  return (
    <FacturenView
      facturen={facturen}
      loadError={facturenError}
      isDemo={isDemo}
      hasCompany={hasCompany}
    />
  );
}
