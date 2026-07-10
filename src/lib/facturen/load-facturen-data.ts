import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { showDemoData } from "@/lib/demo-mode";
import { DEMO_FACTUREN } from "@/lib/demo";
import type { FactuurListItem } from "@/components/dashboard/facturen/FacturenDataTable";
import type { FactuurDocumentContext } from "@/components/dashboard/facturen/FactuurForm";
import { DEFAULT_TEMPLATE } from "@/app/dashboard/instellingen/settings";

export type FacturenCustomer = {
  id: number;
  name: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  btw: string | null;
};

export type FacturenDashboardData = {
  facturen: FactuurListItem[];
  customers: FacturenCustomer[];
  documentContext: FactuurDocumentContext;
  isDemo: boolean;
  hasCompany: boolean;
  stats: {
    maandOmzet: number;
    verzonden: number;
    betaald: number;
    openstaand: number;
  };
};

export async function loadFacturenDashboardData(): Promise<FacturenDashboardData> {
  const preview = await isActivePreviewMode();
  const { supabase, companyId } = await getCompanyContext();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  let facturen: FactuurListItem[] = [];
  let customers: FacturenCustomer[] = [];

  let documentContext: FactuurDocumentContext = {
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

  if (companyId) {
    const [{ data }, { data: klanten }, { data: bedrijf }] = await Promise.all([
      supabase
        .from("facturen")
        .select(
          "id, nummer, klant, totaal_bedrag, datum, vervaldatum, status, document_type, paid_at, customer_id",
        )
        .eq("bedrijf_id", companyId)
        .order("created_at", { ascending: false }),
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
          "naam, adres, postcode, stad, telefoon, email, btw, iban, algemene_voorwaarden, footer_tekst, default_invoice_template",
        )
        .eq("id", companyId)
        .maybeSingle(),
    ]);

    const rows = data ?? [];
    customers = klanten ?? [];
    documentContext = {
      defaultTemplate: bedrijf?.default_invoice_template || DEFAULT_TEMPLATE,
      bedrijf: bedrijf ?? documentContext.bedrijf,
    };

    const customerIds = [
      ...new Set(
        rows
          .map((r) => r.customer_id)
          .filter((id): id is number => typeof id === "number"),
      ),
    ];
    const contactMap = new Map<
      number,
      { email: string | null; phone: string | null }
    >();
    if (customerIds.length > 0) {
      const { data: contactRows } = await supabase
        .from("customers")
        .select("id, email, phone")
        .in("id", customerIds);
      for (const k of contactRows ?? []) {
        contactMap.set(k.id, { email: k.email, phone: k.phone });
      }
    }

    facturen = rows.map((r) => {
      const contact = r.customer_id ? contactMap.get(r.customer_id) : undefined;
      return {
        id: r.id,
        nummer: r.nummer,
        klant: r.klant,
        totaal_bedrag: r.totaal_bedrag,
        datum: r.datum,
        vervaldatum: r.vervaldatum,
        status: r.status,
        document_type: r.document_type,
        paid_at: r.paid_at,
        email: contact?.email ?? null,
        phone: contact?.phone ?? null,
      };
    });
  }

  const isDemo = showDemoData(preview, facturen.length === 0);
  if (isDemo) facturen = DEMO_FACTUREN;

  const maandOmzet = facturen
    .filter((f) => f.document_type === "factuur" && (f.datum ?? "") >= monthStart)
    .reduce((s, f) => s + Number(f.totaal_bedrag ?? 0), 0);
  const verzonden = facturen.filter((f) => f.status === "verzonden").length;
  const betaald = facturen.filter((f) => f.paid_at || f.status === "betaald")
    .length;
  const openstaand = facturen
    .filter(
      (f) =>
        f.document_type === "factuur" &&
        !f.paid_at &&
        f.status !== "betaald",
    )
    .reduce((s, f) => s + Number(f.totaal_bedrag ?? 0), 0);

  return {
    facturen,
    customers,
    documentContext,
    isDemo,
    hasCompany: Boolean(companyId),
    stats: { maandOmzet, verzonden, betaald, openstaand },
  };
}
