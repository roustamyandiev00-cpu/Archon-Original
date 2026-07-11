import FactuurForm from "@/components/dashboard/facturen/FactuurForm";
import { loadFacturenDashboardData } from "@/lib/facturen/load-facturen-data";

export const metadata = { title: "Nieuwe factuur — ArchonPro" };

export default async function NieuweFactuurPage() {
  const { customers, documentContext, isDemo } =
    await loadFacturenDashboardData();

  return (
    <div
      className="facturen-create-shell studio-invoice-shell flex max-w-none flex-col lg:-mx-2 lg:-my-6"
      data-theme="light"
    >
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
