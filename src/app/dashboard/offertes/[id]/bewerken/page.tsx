import { notFound, redirect } from "next/navigation";
import { getCompanyContext } from "@/lib/company";
import { isOfferteEditable } from "@/lib/offertes";
import { loadActivePrijslijstItems } from "@/lib/prijslijst";
import OfferteForm, {
  type OfferteDocumentContext,
  type OfferteFormInitial,
} from "@/components/dashboard/offertes/OfferteForm";
import { DEFAULT_TEMPLATE } from "@/app/dashboard/instellingen/settings";

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

  const { data: offerte, error: offerteError } = await supabase
    .from("offertes")
    .select(
      "id, nummer, klant, customer_id, datum, geldig_tot, notes, status_new, template_id, project_naam, afmetingen",
    )
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (offerteError) {
    throw new Error("De offerte kon niet worden geladen.");
  }
  if (!offerte) notFound();

  // Vergrendelde (definitief bevestigde) offertes kun je niet bewerken.
  if (!isOfferteEditable(offerte.status_new)) {
    redirect(`/dashboard/offertes/${offerteId}`);
  }

  const { data: lijnen, error: lijnenError } = await supabase
    .from("offerte_lijnen")
    .select("omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage")
    .eq("offerte_id", offerteId)
    .eq("company_id", companyId)
    .order("sort_order");
  if (lijnenError) {
    throw new Error("De offertelijnen konden niet worden geladen.");
  }

  let customers: {
    id: number;
    name: string;
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    btw: string | null;
  }[] = [];

  const [
    { data: klantData, error: klantenError },
    { data: bedrijf, error: bedrijfError },
    prijslijstItems,
  ] =
    await Promise.all([
      supabase
        .from("customers")
        .select(
          "id, name, company_name, first_name, last_name, address, email, phone, btw",
        )
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("bedrijven")
        .select(
          "naam, adres, postcode, stad, telefoon, email, btw, iban, algemene_voorwaarden, footer_tekst, default_quote_template",
        )
        .eq("id", companyId)
        .maybeSingle(),
      loadActivePrijslijstItems(supabase, companyId),
    ]);
  if (klantenError || bedrijfError) {
    throw new Error("De editorgegevens konden niet volledig worden geladen.");
  }
  customers = klantData ?? [];

  if (
    offerte.customer_id &&
    !customers.some((customer) => customer.id === offerte.customer_id)
  ) {
    const { data: linkedCustomer, error: linkedCustomerError } = await supabase
      .from("customers")
      .select(
        "id, name, company_name, first_name, last_name, address, email, phone, btw",
      )
      .eq("id", offerte.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    if (linkedCustomerError) {
      throw new Error("De gekoppelde klant kon niet worden geladen.");
    }
    if (linkedCustomer) customers = [linkedCustomer, ...customers];
  }

  const documentContext: OfferteDocumentContext = {
    templateId: offerte.template_id ?? undefined,
    defaultTemplate: bedrijf?.default_quote_template || DEFAULT_TEMPLATE,
    bedrijf: bedrijf ?? {
      naam: null,
      adres: null,
      postcode: null,
      stad: null,
      telefoon: null,
      email: null,
      btw: null,
      iban: null,
      algemene_voorwaarden: null,
      footer_tekst: null,
    },
  };

  const initial: OfferteFormInitial = {
    customerId: offerte.customer_id ? String(offerte.customer_id) : "",
    klantVrij: offerte.customer_id ? "" : (offerte.klant ?? ""),
    datum: offerte.datum ?? new Date().toISOString().slice(0, 10),
    geldigTot: offerte.geldig_tot ?? "",
    notes: offerte.notes ?? "",
    projectNaam: offerte.project_naam ?? "",
    afmetingen: offerte.afmetingen ?? "",
    lines: (lijnen ?? []).map((l) => ({
      omschrijving: l.omschrijving ?? "",
      aantal: Number(l.aantal ?? 0),
      eenheid: l.eenheid ?? "stuks",
      prijs_per_eenheid: Number(l.prijs_per_eenheid ?? 0),
      btw_percentage: Number(l.btw_percentage ?? 0),
    })),
  };

  return (
    <OfferteForm
      customers={customers}
      documentContext={documentContext}
      offerteId={offerteId}
      initial={initial}
      nummer={offerte.nummer ?? undefined}
      prijslijstItems={prijslijstItems}
      status={offerte.status_new ?? "concept"}
    />
  );
}
