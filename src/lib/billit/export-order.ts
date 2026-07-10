import type { SupabaseClient } from "@supabase/supabase-js";
import { createBillitOrder, type BillitCredentials } from "@/lib/billit/client";
import { untyped } from "@/lib/integraties";

type FactuurExportRow = {
  id: number;
  nummer: string | null;
  klant: string | null;
  datum: string;
  vervaldatum: string | null;
  document_type: string;
  buyer_reference: string | null;
  structured_communication: string | null;
  omschrijving: string | null;
  customer_id: number | null;
};

type LijnRow = {
  omschrijving: string | null;
  aantal: number | null;
  prijs_per_eenheid: number | null;
  btw_percentage: number | null;
};

type CustomerRow = {
  name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postcode: string | null;
  city: string | null;
  country: string | null;
  btw: string | null;
  ondernemingsnummer: string | null;
};

function splitStreet(address: string | null | undefined) {
  const raw = (address ?? "").trim();
  if (!raw) return { street: "", streetNumber: "" };
  const m = raw.match(/^(.+?)\s+(\d+\S*)$/);
  if (m) return { street: m[1], streetNumber: m[2] };
  return { street: raw, streetNumber: "" };
}

function buildBillitOrder(
  factuur: FactuurExportRow,
  lijnen: LijnRow[],
  customer: CustomerRow | null,
) {
  const isCredit = factuur.document_type === "creditnota";
  const customerName =
    customer?.company_name?.trim() ||
    customer?.name?.trim() ||
    factuur.klant ||
    "Klant";
  const { street, streetNumber } = splitStreet(customer?.address);

  return {
    OrderType: isCredit ? "CreditNote" : "Invoice",
    OrderDirection: "Income",
    OrderNumber: factuur.nummer ?? String(factuur.id),
    OrderDate: factuur.datum,
    ExpiryDate: factuur.vervaldatum ?? factuur.datum,
    OrderTitle: factuur.buyer_reference ?? undefined,
    PaymentReference: factuur.structured_communication ?? undefined,
    Customer: {
      Name: customerName,
      VATNumber: customer?.btw ?? undefined,
      PartyType: "Customer",
      Email: customer?.email ?? undefined,
      Phone: customer?.phone ?? undefined,
      Nr: customer?.ondernemingsnummer ?? undefined,
      Addresses: [
        {
          AddressType: "InvoiceAddress",
          Name: customerName,
          Street: street || undefined,
          StreetNumber: streetNumber || undefined,
          City: customer?.city ?? undefined,
          Zipcode: customer?.postcode ?? undefined,
          CountryCode: customer?.country ?? "BE",
        },
      ],
    },
    OrderLines: lijnen.map((l) => ({
      Quantity: Number(l.aantal ?? 1),
      UnitPriceExcl: Number(l.prijs_per_eenheid ?? 0),
      Description: l.omschrijving ?? "Regel",
      VATPercentage: Number(l.btw_percentage ?? 21),
    })),
    ExternalData: [
      {
        Key: "archonpro_factuur_id",
        Value: String(factuur.id),
      },
    ],
  };
}

export async function exportFactuurToBillit(
  supabaseClient: unknown,
  companyId: number,
  factuurId: number,
  creds: BillitCredentials,
): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  const supabase = untyped(supabaseClient) as SupabaseClient;

  const { data: factuur } = await supabase
    .from("facturen")
    .select(
      "id, nummer, klant, datum, vervaldatum, document_type, buyer_reference, structured_communication, omschrijving, customer_id, accounting_export_id",
    )
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!factuur) return { ok: false, error: "Factuur niet gevonden." };
  if (factuur.accounting_export_id) {
    return {
      ok: false,
      error: `Al geëxporteerd naar Billit (Order ${factuur.accounting_export_id}).`,
    };
  }

  const { data: lijnen } = await supabase
    .from("factuur_lijnen")
    .select("omschrijving, aantal, prijs_per_eenheid, btw_percentage")
    .eq("factuur_id", factuurId)
    .order("sort_order");

  if (!lijnen?.length) {
    return { ok: false, error: "Factuur heeft geen regels om te exporteren." };
  }

  let customer: CustomerRow | null = null;
  if (factuur.customer_id) {
    const { data } = await supabase
      .from("customers")
      .select(
        "name, company_name, email, phone, address, postcode, city, country, btw, ondernemingsnummer",
      )
      .eq("id", factuur.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    customer = data;
  }

  const order = buildBillitOrder(
    factuur as FactuurExportRow,
    lijnen as LijnRow[],
    customer,
  );
  const result = await createBillitOrder(creds, order);
  if (!result.ok) return result;

  const now = new Date().toISOString();
  await supabase
    .from("facturen")
    .update({
      accounting_export_provider: "billit",
      accounting_export_id: result.orderId,
      accounting_exported_at: now,
      accounting_export_error: null,
      updated_at: now,
    })
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId);

  return { ok: true, orderId: result.orderId };
}

export async function exportFacturenBatchToBillit(
  supabaseClient: unknown,
  companyId: number,
  creds: BillitCredentials,
  factuurIds?: number[],
): Promise<{
  ok: true;
  exported: number;
  failed: { id: number; error: string }[];
}> {
  const supabase = untyped(supabaseClient) as SupabaseClient;

  let query = supabase
    .from("facturen")
    .select("id")
    .eq("bedrijf_id", companyId)
    .is("accounting_export_id", null)
    .neq("status", "concept")
    .order("created_at", { ascending: false })
    .limit(25);

  if (factuurIds?.length) {
    query = query.in("id", factuurIds);
  }

  const { data: rows } = await query;
  const ids = (rows ?? []).map((r) => r.id);
  const failed: { id: number; error: string }[] = [];
  let exported = 0;

  for (const id of ids) {
    const res = await exportFactuurToBillit(
      supabaseClient,
      companyId,
      id,
      creds,
    );
    if (res.ok) exported += 1;
    else failed.push({ id, error: res.error });
  }

  return { ok: true, exported, failed };
}
