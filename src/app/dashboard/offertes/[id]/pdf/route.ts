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
  return input.replace(/[^\w.\- ]+/g, "").trim() || "offerte";
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const offerteId = Number(id);
  const { supabase, companyId } = await getCompanyContext();
  if (!companyId || Number.isNaN(offerteId)) {
    return new Response("Niet gevonden", { status: 404 });
  }

  const { data: offerte } = await supabase
    .from("offertes")
    .select("id, nummer, klant, datum, geldig_tot, notes, customer_id, template_id")
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!offerte) return new Response("Niet gevonden", { status: 404 });

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

  const requested = req.nextUrl.searchParams.get("template");
  const templateId = resolveTemplateId(requested || offerte.template_id);
  const html = buildDocumentHtml(templateId, "quote", values, rows);

  const pdf = await htmlToPdf(html);
  const fileName = safeFileName(`Offerte-${offerte.nummer ?? offerte.id}`);

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
