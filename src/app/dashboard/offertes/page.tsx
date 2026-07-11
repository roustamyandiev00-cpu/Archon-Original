import { isActivePreviewMode } from "@/components/dashboard/context";
import { getCompanyContext } from "@/lib/company";
import { DEMO_OFFERTES } from "@/lib/demo";
import { showDemoData } from "@/lib/demo-mode";
import { loadUserAgentName } from "@/lib/agents/userAi";
import { DEFAULT_TEMPLATE } from "@/app/dashboard/instellingen/settings";
import OffertesView, {
  type OfferteListRow,
} from "@/components/dashboard/offertes/OffertesView";
import type { OfferteDocumentContext } from "@/components/dashboard/offertes/OfferteForm";

export const metadata = { title: "Offertes — ArchonPro" };

export default async function OffertesPage() {
  const preview = await isActivePreviewMode();
  const { supabase, companyId, user } = await getCompanyContext();

  let offertes: OfferteListRow[] = [];

  if (companyId) {
    const { data } = await supabase
      .from("offertes")
      .select(
        "id, nummer, klant, bedrag, datum, geldig_tot, status_new, customer_id",
      )
      .eq("bedrijf_id", companyId)
      .order("created_at", { ascending: false });

    const rows = data ?? [];

    const customerIds = [
      ...new Set(
        rows
          .map((r) => r.customer_id)
          .filter((id): id is number => typeof id === "number"),
      ),
    ];
    const contactMap = new Map<number, { email: string | null; phone: string | null }>();
    if (customerIds.length > 0) {
      const { data: klanten } = await supabase
        .from("customers")
        .select("id, email, phone")
        .in("id", customerIds);
      for (const k of klanten ?? []) {
        contactMap.set(k.id, { email: k.email, phone: k.phone });
      }
    }

    offertes = rows.map((r) => {
      const contact = r.customer_id ? contactMap.get(r.customer_id) : undefined;
      return {
        id: r.id,
        nummer: r.nummer,
        klant: r.klant,
        bedrag: r.bedrag,
        datum: r.datum,
        geldig_tot: r.geldig_tot,
        status_new: r.status_new,
        email: contact?.email ?? null,
        phone: contact?.phone ?? null,
      };
    });
  }

  const isDemo = showDemoData(preview, offertes.length === 0);
  if (isDemo) offertes = DEMO_OFFERTES;

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
  let documentContext: OfferteDocumentContext = {
    defaultTemplate: DEFAULT_TEMPLATE,
    bedrijf: {
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
  let agentName = "Lima";

  if (companyId) {
    const [{ data: klanten }, { data: bedrijf }] = await Promise.all([
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
    ]);
    customers = klanten ?? [];
    documentContext = {
      defaultTemplate: bedrijf?.default_quote_template || DEFAULT_TEMPLATE,
      bedrijf: bedrijf ?? documentContext.bedrijf,
    };
  }
  if (user) {
    agentName = await loadUserAgentName(supabase, user.id);
  }

  return (
    <OffertesView
      offertes={offertes}
      isDemo={isDemo}
      companyId={companyId}
      agentName={agentName}
      customers={customers}
      documentContext={documentContext}
    />
  );
}
