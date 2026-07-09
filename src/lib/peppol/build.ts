import type { SupabaseClient } from "@supabase/supabase-js";
import { untyped } from "@/lib/integraties";
import {
  normalizeBelgianVat,
  normalizeStructuredCommunication,
  peppolEndpointFromParty,
} from "@/lib/peppol/be";
import type { UblInvoice, UblParty } from "@/lib/peppol/ubl";
import { validatePeppolInvoice } from "@/lib/peppol/validate";

export type PeppolConfig = {
  accessPoint: string;
  participantId: string;
  apiKey: string;
  legalEntityId?: string;
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
    legalEntityId: c.legalEntityId,
  };
}

function partyFromRecord(
  record: {
    name: string;
    vat?: string | null;
    address?: string | null;
    city?: string | null;
    postalZone?: string | null;
    country?: string | null;
    peppolParticipantId?: string | null;
    kbo?: string | null;
  },
): UblParty {
  const ep = peppolEndpointFromParty({
    peppolParticipantId: record.peppolParticipantId,
    kbo: record.kbo,
    vat: record.vat,
  });
  return {
    name: record.name,
    vat: normalizeBelgianVat(record.vat),
    address: record.address ?? null,
    city: record.city ?? null,
    postalZone: record.postalZone ?? null,
    country: record.country ?? "BE",
    endpointScheme: ep?.scheme ?? null,
    endpointValue: ep?.value ?? null,
  };
}

export type BuiltFactuurUbl = {
  ubl: UblInvoice;
  nummer: string;
  factuurId: number;
  readiness: ReturnType<typeof validatePeppolInvoice>;
  isCreditNote: boolean;
};

/**
 * Bouwt de UBL-factuurstructuur voor één factuur op basis van bedrijfs-,
 * klant- en regelgegevens. Retourneert null als de factuur niet bestaat.
 */
export async function buildFactuurUbl(
  supabaseClient: unknown,
  companyId: number,
  factuurId: number,
  peppol: PeppolConfig,
): Promise<BuiltFactuurUbl | null> {
  const supabase = untyped(supabaseClient) as SupabaseClient;

  const { data: factuur } = await supabase
    .from("facturen")
    .select(
      "id, nummer, klant, datum, vervaldatum, customer_id, document_type, buyer_reference, structured_communication, omschrijving",
    )
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();
  if (!factuur) return null;

  const isCreditNote = factuur.document_type === "creditnota";

  const { data: lijnen } = await supabase
    .from("factuur_lijnen")
    .select("omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage")
    .eq("factuur_id", factuurId)
    .order("sort_order");

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select("naam, adres, postcode, stad, btw, iban, kvk, peppol_participant_id")
    .eq("id", companyId)
    .maybeSingle();

  let customer: {
    name: string | null;
    company_name: string | null;
    address: string | null;
    btw: string | null;
    postcode: string | null;
    city: string | null;
    country: string | null;
    ondernemingsnummer: string | null;
    peppol_participant_id: string | null;
  } | null = null;
  if (factuur.customer_id) {
    const { data } = await supabase
      .from("customers")
      .select(
        "name, company_name, address, btw, kvk, postcode, city, country, ondernemingsnummer, peppol_participant_id",
      )
      .eq("id", factuur.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    customer = data;
  }

  const supplierParticipant =
    peppol?.participantId ||
    bedrijf?.peppol_participant_id ||
    null;

  const supplier = partyFromRecord({
    name: bedrijf?.naam ?? "Onbekend",
    vat: bedrijf?.btw,
    address: bedrijf?.adres,
    city: bedrijf?.stad,
    postalZone: bedrijf?.postcode,
    country: "BE",
    peppolParticipantId: supplierParticipant,
    kbo: bedrijf?.kvk,
  });

  const customerName =
    customer?.company_name?.trim() ||
    customer?.name?.trim() ||
    factuur.klant ||
    "Klant";

  const buyer = partyFromRecord({
    name: customerName,
    vat: customer?.btw,
    address: customer?.address,
    city: customer?.city,
    postalZone: customer?.postcode,
    country: customer?.country ?? "BE",
    peppolParticipantId: customer?.peppol_participant_id,
    kbo: customer?.ondernemingsnummer ?? customer?.kvk,
  });

  const buyerReference =
    factuur.buyer_reference?.trim() ||
    factuur.omschrijving?.trim() ||
    factuur.nummer ||
    String(factuur.id);

  const structuredCommunication = normalizeStructuredCommunication(
    factuur.structured_communication,
  );

  const ubl: UblInvoice = {
    id: factuur.nummer ?? String(factuur.id),
    issueDate: factuur.datum ?? new Date().toISOString().slice(0, 10),
    dueDate: factuur.vervaldatum,
    currency: "EUR",
    supplier,
    customer: buyer,
    iban: bedrijf?.iban ?? null,
    buyerReference,
    structuredCommunication,
    invoiceTypeCode: isCreditNote ? "381" : "380",
    note: factuur.omschrijving,
    lines: (lijnen ?? []).map((l) => ({
      name: l.omschrijving ?? "",
      quantity: Number(l.aantal ?? 0),
      unitCode: l.eenheid ?? "stuks",
      unitPrice: Number(l.prijs_per_eenheid ?? 0),
      vatPercent: Number(l.btw_percentage ?? 0),
    })),
  };

  const readiness = validatePeppolInvoice(ubl, {
    isCreditNote,
    structuredCommunication,
  });

  return {
    ubl,
    nummer: factuur.nummer ?? String(factuur.id),
    factuurId: factuur.id,
    readiness,
    isCreditNote,
  };
}

/** Synchroniseer bedrijfsgegevens naar company_legal_entities (EN16931 BT-27..). */
export async function syncCompanyLegalEntity(
  supabaseClient: unknown,
  companyId: number,
) {
  const supabase = untyped(supabaseClient) as SupabaseClient;
  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select("naam, kvk, btw, iban, adres, postcode, stad")
    .eq("id", companyId)
    .maybeSingle();
  if (!bedrijf?.kvk?.trim() || !bedrijf?.btw?.trim()) return;

  const payload = {
    bedrijf_id: companyId,
    legal_name: bedrijf.naam,
    enterprise_number: bedrijf.kvk.trim(),
    vat_number: normalizeBelgianVat(bedrijf.btw) ?? bedrijf.btw.trim(),
    iban: bedrijf.iban,
    street: bedrijf.adres,
    postal_code: bedrijf.postcode,
    city: bedrijf.stad,
    country_code: "BE",
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("company_legal_entities")
    .select("id")
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("company_legal_entities")
      .update(payload)
      .eq("bedrijf_id", companyId);
  } else {
    await supabase.from("company_legal_entities").insert(payload);
  }
}
