import { Tags } from "lucide-react";
import Link from "next/link";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { getCompanyContext } from "@/lib/company";
import { DEMO_PRIJSLIJST } from "@/lib/demo";
import { showDemoData } from "@/lib/demo-mode";
import { untyped } from "@/lib/integraties";
import {
  PageHeader,
  NoCompanyNotice,
  DemoBadge,
} from "@/components/dashboard/mission";
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
  const preview = await isActivePreviewMode();
  const { supabase, companyId } = await getCompanyContext();

  let items: PrijslijstItem[] = [];
  let error: { message: string } | null = null;

  if (companyId) {
    const res = await untyped(supabase)
      .from("prijslijst_items")
      .select(
        "id, omschrijving, eenheid, prijs, btw_percentage, categorie, is_active",
      )
      .eq("company_id", companyId)
      .order("omschrijving", { ascending: true })
      .limit(500);

    error = res.error ? { message: res.error.message } : null;
    items = ((res.data ?? []) as PrijslijstRow[]).map((row) => ({
      id: row.id,
      omschrijving: row.omschrijving,
      eenheid: row.eenheid,
      prijs: Number(row.prijs) || 0,
      btwPercentage: Number(row.btw_percentage) || 0,
      categorie: row.categorie,
      isActive: row.is_active,
    }));
  }

  const isDemo = showDemoData(preview, items.length === 0);
  if (isDemo) {
    items = DEMO_PRIJSLIJST;
    error = null;
  }

  if (!companyId && !preview) {
    return (
      <div className="mx-auto max-w-6xl">
        <NoCompanyNotice />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          icon={<Tags size={20} />}
          title="Prijslijst"
          description="Standaardprijzen en eenheden voor snellere offertes."
        />
        {isDemo && <DemoBadge />}
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200"
        >
          <p>De prijslijst kon niet worden geladen. Je gegevens zijn niet gewijzigd.</p>
          <Link
            href="/dashboard/prijslijst"
            className="mt-2 inline-flex text-sm font-semibold text-rose-100 underline underline-offset-4"
          >
            Opnieuw proberen
          </Link>
        </div>
      ) : (
        <PrijslijstManager items={items} />
      )}
    </div>
  );
}
