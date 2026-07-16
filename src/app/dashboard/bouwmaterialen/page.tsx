import { getCompanyContext } from "@/lib/company";
import MateriaalZoekClient from "@/components/dashboard/bouwmaterialen/MateriaalZoekClient";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { Package } from "lucide-react";
import { untyped } from "@/lib/integraties";

export const metadata = { title: "Bouwmaterialen zoeken — ArchonPro" };

export default async function DashboardBouwmaterialenPage() {
  const { supabase, companyId } = await getCompanyContext();
  if (!companyId) {
    return (
      <PlaceholderPage
        title="Bouwmaterialen"
        description="Zoek prijzen bij leveranciers."
        icon={<Package size={20} />}
        features={["Koppel eerst een bedrijf."]}
        moduleId="bouwmaterialen"
      />
    );
  }

  const { data: winkels } = await untyped(supabase)
    .from("bouwmateriaal_winkels")
    .select("id, naam, regio, verificatiestatus")
    .order("naam")
    .limit(200);

  return (
    <MateriaalZoekClient
      winkels={(winkels ?? []).map(
        (w: {
          id: number;
          naam: string;
          regio: string | null;
          verificatiestatus: string;
        }) => ({
          id: w.id,
          naam: w.naam,
          regio: w.regio,
          verificatiestatus: w.verificatiestatus,
        }),
      )}
    />
  );
}
