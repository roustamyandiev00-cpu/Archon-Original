import type { SupabaseClient } from "@supabase/supabase-js";
import { htmlToPdf } from "@/lib/pdf";
import {
  buildDocumentValues,
  buildDocumentRows,
  type CustomerLite,
} from "@/lib/documentData";
import {
  buildDocumentHtml,
  resolveTemplateId,
} from "@/components/dashboard/documenten/documentTemplate";

export async function buildOffertePdfBuffer(
  supabase: SupabaseClient,
  companyId: number,
  offerteId: number,
  templateOverride?: string | null,
): Promise<{ pdf: Buffer; nummer: string; klant: string } | null> {
  const { data: offerte } = await supabase
    .from("offertes")
    .select("id, nummer, klant, datum, geldig_tot, notes, customer_id, template_id")
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!offerte) return null;

  const { data: lijnen } = await supabase
    .from("offerte_lijnen")
    .select("omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage")
    .eq("offerte_id", offerteId)
    .order("sort_order");

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select(
      "naam, adres, postcode, stad, telefoon, email, btw, iban, algemene_voorwaarden, footer_tekst",
    )
    .eq("id", companyId)
    .maybeSingle();

  let customer: CustomerLite = null;
  if (offerte.customer_id) {
    const { data } = await supabase
      .from("customers")
      .select("name, company_name, first_name, last_name, address, email, phone, btw")
      .eq("id", offerte.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    customer = data;
  }

  const lines = (lijnen ?? []).map((l) => ({
    omschrijving: l.omschrijving ?? "",
    aantal: Number(l.aantal ?? 0),
    eenheid: l.eenheid ?? "stuks",
    prijs_per_eenheid: Number(l.prijs_per_eenheid ?? 0),
    btw_percentage: Number(l.btw_percentage ?? 0),
  }));

  const values = buildDocumentValues(
    {
      kind: "quote",
      nummer: offerte.nummer ?? `#${offerte.id}`,
      datum: offerte.datum,
      geldig_tot: offerte.geldig_tot,
      notes: offerte.notes,
      klant: offerte.klant,
    },
    bedrijf,
    customer,
    lines,
  );
  const rows = buildDocumentRows(lines);
  const templateId = resolveTemplateId(
    templateOverride || offerte.template_id,
  );
  const html = buildDocumentHtml(templateId, "quote", values, rows);
  const pdf = await htmlToPdf(html);

  return {
    pdf,
    nummer: offerte.nummer ?? `#${offerte.id}`,
    klant: offerte.klant ?? "Klant",
  };
}
