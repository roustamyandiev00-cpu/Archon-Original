import { notFound, redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { isOfferteEditable } from "@/lib/offertes";
import OfferteForm, {
  type OfferteFormInitial,
} from "@/components/dashboard/offertes/OfferteForm";

export const metadata = { title: "Offerte bewerken — ArchonPro" };

export default async function OfferteBewerkenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offerteId = Number(id);
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId || Number.isNaN(offerteId)) notFound();

  const { data: offerte } = await supabase
    .from("offertes")
    .select(
      "id, nummer, klant, customer_id, datum, geldig_tot, notes, status_new",
    )
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!offerte) notFound();

  // Vergrendelde (definitief bevestigde) offertes kun je niet bewerken.
  if (!isOfferteEditable(offerte.status_new)) {
    redirect(`/dashboard/offertes/${offerteId}`);
  }

  const { data: lijnen } = await supabase
    .from("offerte_lijnen")
    .select("omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage")
    .eq("offerte_id", offerteId)
    .order("sort_order");

  let customers: { id: number; name: string; company_name: string | null }[] =
    [];
  const { data: klantData } = await supabase
    .from("customers")
    .select("id, name, company_name")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name");
  customers = klantData ?? [];

  const initial: OfferteFormInitial = {
    customerId: offerte.customer_id ? String(offerte.customer_id) : "",
    klantVrij: offerte.customer_id ? "" : (offerte.klant ?? ""),
    datum: offerte.datum ?? new Date().toISOString().slice(0, 10),
    geldigTot: offerte.geldig_tot ?? "",
    notes: offerte.notes ?? "",
    lines: (lijnen ?? []).map((l) => ({
      omschrijving: l.omschrijving ?? "",
      aantal: Number(l.aantal ?? 0),
      eenheid: l.eenheid ?? "stuks",
      prijs_per_eenheid: Number(l.prijs_per_eenheid ?? 0),
      btw_percentage: Number(l.btw_percentage ?? 0),
    })),
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
          <FileText size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">
            Offerte bewerken
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Pas de gegevens aan en bekijk rechts direct de preview.
          </p>
        </div>
      </header>

      <OfferteForm
        customers={customers}
        offerteId={offerteId}
        initial={initial}
        nummer={offerte.nummer ?? undefined}
      />
    </div>
  );
}
