import type { SupabaseClient } from "@supabase/supabase-js";
import { htmlToPdf } from "@/lib/pdf";
import {
  buildDocumentValues,
  buildDocumentRows,
  type CustomerLite,
} from "@/lib/documentData";
import {
  buildDocumentHtml,
  resolveDocumentTemplateId,
} from "@/components/dashboard/documenten/documentTemplate";

export async function generateFactuurPdfBuffer(
  supabase: SupabaseClient,
  companyId: number,
  factuurId: number,
): Promise<{ buffer: Buffer; fileName: string } | { error: string }> {
  const { data: factuur } = await supabase
    .from("facturen")
    .select(
      "id, nummer, klant, datum, vervaldatum, document_type, omschrijving, customer_id, template_id",
    )
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!factuur) return { error: "Factuur niet gevonden." };

  const { data: lijnen } = await supabase
    .from("factuur_lijnen")
    .select("omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage")
    .eq("factuur_id", factuurId)
    .order("sort_order");

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select(
      "naam, adres, postcode, stad, telefoon, email, btw, iban, algemene_voorwaarden, footer_tekst, default_invoice_template",
    )
    .eq("id", companyId)
    .maybeSingle();

  let customer: CustomerLite = null;
  if (factuur.customer_id) {
    const { data } = await supabase
      .from("customers")
      .select(
        "name, company_name, first_name, last_name, address, email, phone, btw",
      )
      .eq("id", factuur.customer_id)
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
      kind: "invoice",
      nummer: factuur.nummer ?? `#${factuur.id}`,
      datum: factuur.datum,
      vervaldatum: factuur.vervaldatum,
      omschrijving: factuur.omschrijving,
      klant: factuur.klant,
      isProforma: factuur.document_type === "proforma",
    },
    bedrijf,
    customer,
    lines,
  );
  const rows = buildDocumentRows(lines);
  const templateId = resolveDocumentTemplateId(
    factuur.template_id,
    bedrijf?.default_invoice_template,
  );
  const html = buildDocumentHtml(templateId, "invoice", values, rows);
  const pdf = await htmlToPdf(html);
  const safeNummer = (factuur.nummer ?? String(factuur.id)).replace(
    /[^\w.\- ]+/g,
    "",
  );

  return {
    buffer: Buffer.from(pdf),
    fileName: `Factuur-${safeNummer || factuur.id}.pdf`,
  };
}
