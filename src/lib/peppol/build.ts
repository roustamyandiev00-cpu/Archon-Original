import type { SupabaseClient } from "@supabase/supabase-js";
import { untyped } from "@/lib/integraties";
import type { UblInvoice, UblParty } from "@/lib/peppol/ubl";

export type PeppolConfig = {
  accessPoint: string;
  participantId: string;
  apiKey: string;
} | null;

/** Haalt de Peppol access point-configuratie van het bedrijf op (indien verbonden). */
export async function getPeppolConfig(
  supabase: unknown,
  companyId: number,
): Promise<PeppolConfig> {
  const { data } = await untyped(supabase)
    .from("integraties")
    .select("status, config")
    .eq("bedrijf_id", companyId)
    .eq("provider", "peppol")
    .maybeSingle();
  if (!data || data.status !== "connected") return null;
  const c = (data.config ?? {}) as Record<string, string>;
  return {
    accessPoint: c.accessPoint ?? "",
    participantId: c.participantId ?? "",
    apiKey: c.apiKey ?? "",
  };
}

function splitParticipant(
  participantId: string | undefined,
): { scheme: string | null; value: string | null } {
  if (!participantId) return { scheme: null, value: null };
  const idx = participantId.indexOf(":");
  if (idx === -1) return { scheme: "0208", value: participantId.trim() };
  return {
    scheme: participantId.slice(0, idx).trim(),
    value: participantId.slice(idx + 1).trim(),
  };
}

/**
 * Bouwt de UBL-factuurstructuur voor één factuur op basis van bedrijfs-,
 * klant- en regelgegevens. Retourneert null als de factuur niet bestaat.
 */
export async function buildFactuurUbl(
  supabaseClient: unknown,
  companyId: number,
  factuurId: number,
  peppol: PeppolConfig,
): Promise<{ ubl: UblInvoice; nummer: string } | null> {
  const supabase = untyped(supabaseClient) as SupabaseClient;

  const { data: factuur } = await supabase
    .from("facturen")
    .select("id, nummer, klant, datum, vervaldatum, customer_id")
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();
  if (!factuur) return null;

  const { data: lijnen } = await supabase
    .from("factuur_lijnen")
    .select("omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage")
    .eq("factuur_id", factuurId)
    .order("sort_order");

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select("naam, adres, postcode, stad, btw, iban")
    .eq("id", companyId)
    .maybeSingle();

  let customer: {
    name: string | null;
    company_name: string | null;
    address: string | null;
    btw: string | null;
  } | null = null;
  if (factuur.customer_id) {
    const { data } = await supabase
      .from("customers")
      .select("name, company_name, address, btw")
      .eq("id", factuur.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    customer = data;
  }

  const supplierEndpoint = splitParticipant(peppol?.participantId || undefined);
  const supplier: UblParty = {
    name: bedrijf?.naam ?? "Onbekend",
    vat: bedrijf?.btw ?? null,
    address: bedrijf?.adres ?? null,
    city: bedrijf?.stad ?? null,
    postalZone: bedrijf?.postcode ?? null,
    country: "BE",
    endpointScheme: supplierEndpoint.scheme,
    endpointValue: supplierEndpoint.value,
  };

  const customerName =
    customer?.company_name?.trim() ||
    customer?.name?.trim() ||
    factuur.klant ||
    "Klant";
  const buyer: UblParty = {
    name: customerName,
    vat: customer?.btw ?? null,
    address: customer?.address ?? null,
    country: "BE",
  };

  const ubl: UblInvoice = {
    id: factuur.nummer ?? String(factuur.id),
    issueDate: factuur.datum ?? new Date().toISOString().slice(0, 10),
    dueDate: factuur.vervaldatum,
    currency: "EUR",
    supplier,
    customer: buyer,
    iban: bedrijf?.iban ?? null,
    lines: (lijnen ?? []).map((l) => ({
      name: l.omschrijving ?? "",
      quantity: Number(l.aantal ?? 0),
      unitCode: l.eenheid ?? "stuks",
      unitPrice: Number(l.prijs_per_eenheid ?? 0),
      vatPercent: Number(l.btw_percentage ?? 0),
    })),
  };

  return { ubl, nummer: factuur.nummer ?? String(factuur.id) };
}
