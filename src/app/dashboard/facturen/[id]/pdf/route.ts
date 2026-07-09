import type { NextRequest } from "next/server";
import { getCompanyContext } from "@/lib/company";
import { htmlToPdf } from "@/lib/pdf";
import {
  buildDocumentValues,
  buildDocumentRows,
  type CustomerLite,
} from "@/lib/documentData";
import { buildDocumentHtml, resolveTemplateId } from "@/components/dashboard/documenten/documentTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFileName(input: string): string {
  return input.replace(/[^\w.\- ]+/g, "").trim() || "factuur";
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const factuurId = Number(id);
  const { supabase, companyId } = await getCompanyContext();
  if (!companyId || Number.isNaN(factuurId)) {
    return new Response("Niet gevonden", { status: 404 });
  }

  const { data: factuur } = await supabase
    .from("facturen")
    .select(
      "id, nummer, klant, datum, vervaldatum, document_type, omschrijving, customer_id, template_id",
    )
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!factuur) return new Response("Niet gevonden", { status: 404 });

  const { data: lijnen } = await supabase
    .from("factuur_lijnen")
    .select("omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage")
    .eq("factuur_id", factuurId)
    .order("sort_order");

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select(
      "naam, adres, postcode, stad, telefoon, email, btw, iban, algemene_voorwaarden, footer_tekst",
    )
    .eq("id", companyId)
    .maybeSingle();

  let customer: CustomerLite = null;
  if (factuur.customer_id) {
    const { data } = await supabase
      .from("customers")
      .select("name, company_name, first_name, last_name, address, email, phone, btw")
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

  const requested = req.nextUrl.searchParams.get("template");
  const templateId = resolveTemplateId(requested || factuur.template_id);
  const html = buildDocumentHtml(templateId, "invoice", values, rows);

  const pdf = await htmlToPdf(html);
  const fileName = safeFileName(`Factuur-${factuur.nummer ?? factuur.id}`);

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
