import { Tags } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { untyped } from "@/lib/integraties";
import { PageHeader, NoCompanyNotice } from "@/components/dashboard/mission";
import ModuleWipBanner from "@/components/dashboard/ModuleWipBanner";
import PrijslijstManager, {
  type PrijslijstItem,
} from "@/components/dashboard/prijslijst/PrijslijstManager";

export const metadata = { title: "Prijslijst — ArchonPro" };

type PrijslijstRow = {
  id: number;
  omschrijving: string;
  eenheid: string;
  prijs: number | string;
  btw_percentage: number | string;
  categorie: string | null;
  is_active: boolean;
};

export default async function PrijslijstPage() {
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId) {
    return (
      <div className="mx-auto max-w-6xl">
        <NoCompanyNotice />
      </div>
    );
  }

  const { data, error } = await untyped(supabase)
    .from("prijslijst_items")
    .select(
      "id, omschrijving, eenheid, prijs, btw_percentage, categorie, is_active",
    )
    .eq("company_id", companyId)
    .order("omschrijving", { ascending: true })
    .limit(500);

  const items: PrijslijstItem[] = ((data ?? []) as PrijslijstRow[]).map(
    (row) => ({
      id: row.id,
      omschrijving: row.omschrijving,
      eenheid: row.eenheid,
      prijs: Number(row.prijs) || 0,
      btwPercentage: Number(row.btw_percentage) || 0,
      categorie: row.categorie,
      isActive: row.is_active,
    }),
  );

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <ModuleWipBanner
        moduleId="prijslijst"
        title="Prijslijst is nog in ontwikkeling"
        description="Je kan items al beheren. Koppeling met offertes wordt verder uitgewerkt. Verberg dit bericht als je wilt."
      />
      <PageHeader
        icon={<Tags size={20} />}
        title="Prijslijst"
        description="Standaardprijzen en eenheden voor snellere offertes."
      />
      {error ? (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          Prijslijst kon niet worden geladen: {error.message}. Pas eerst de
          migratie <code className="text-rose-100">20260716_prijslijst_items</code>{" "}
          toe.
        </p>
      ) : (
        <PrijslijstManager items={items} />
      )}
    </div>
  );
}
