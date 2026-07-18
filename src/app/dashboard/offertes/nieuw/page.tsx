import { getCompanyContext } from "@/lib/company";
import { loadUserAgentName } from "@/lib/agents/userAi";
import { loadActivePrijslijstItems } from "@/lib/prijslijst";
import NieuweOfferteClient from "@/components/dashboard/offertes/NieuweOfferteClient";
import { DEFAULT_TEMPLATE } from "@/app/dashboard/instellingen/settings";
import type { OfferteDocumentContext } from "@/components/dashboard/offertes/OfferteForm";
import type { PrijslijstPickItem } from "@/components/dashboard/prijslijst/types";

export const metadata = { title: "Nieuwe offerte — ArchonPro" };

export default async function NieuweOffertePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode: modeParam } = await searchParams;
  const mode =
    modeParam === "manueel"
      ? "manueel"
      : modeParam === "ai"
        ? "ai"
        : "beide";

  const { supabase, companyId, user } = await getCompanyContext();

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
  let agentName = "Ela";
  let prijslijstItems: PrijslijstPickItem[] = [];
  if (companyId) {
    const [{ data: klanten }, { data: bedrijf }, prijslijst] =
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
    customers = klanten ?? [];
    documentContext = {
      defaultTemplate: bedrijf?.default_quote_template || DEFAULT_TEMPLATE,
      bedrijf: bedrijf ?? documentContext.bedrijf,
    };
    prijslijstItems = prijslijst;
  }
  if (user) {
    agentName = await loadUserAgentName(supabase, user.id);
  }

  return (
    <NieuweOfferteClient
      agentName={agentName}
      customers={customers}
      documentContext={documentContext}
      mode={mode}
      prijslijstItems={prijslijstItems}
    />
  );
}
