import FactuurForm from "@/components/dashboard/facturen/FactuurForm";
import { loadFacturenDashboardData } from "@/lib/facturen/load-facturen-data";

export const metadata = { title: "Nieuwe factuur — ArchonPro" };

export default async function NieuweFactuurPage() {
  const {
    customers,
    projects,
    documentContext,
    prijslijstItems,
    isDemo,
    hasCompany,
  } = await loadFacturenDashboardData();

  // Studio-demo alleen zonder bedrijf; met bedrijf altijd echte data tonen
  const useDemo = isDemo && !hasCompany;

  return (
    <div className="facturen-create-shell studio-invoice-shell">
      <FactuurForm
        customers={customers}
        projects={projects}
        documentContext={documentContext}
        prijslijstItems={prijslijstItems}
        embedded
        isDemo={useDemo}
      />
    </div>
  );
}
