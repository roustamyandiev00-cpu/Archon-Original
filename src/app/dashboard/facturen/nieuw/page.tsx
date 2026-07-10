import FactuurForm from "@/components/dashboard/facturen/FactuurForm";
import { loadFacturenDashboardData } from "@/lib/facturen/load-facturen-data";

export const metadata = { title: "Factuur — ArchonPro" };

export default async function NieuweFactuurPage() {
  const { customers, documentContext, isDemo } =
    await loadFacturenDashboardData();

  return (
    <div className="facturen-create-shell max-w-none lg:-mx-1 lg:-my-3">
      <FactuurForm
        customers={customers}
        documentContext={documentContext}
        embedded
        viewportFit
        isDemo={isDemo}
      />
    </div>
  );
}
