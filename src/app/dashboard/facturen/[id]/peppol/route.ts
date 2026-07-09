import type { NextRequest } from "next/server";
import { getCompanyContext } from "@/lib/company";
import { getPeppolConfig, buildFactuurUbl } from "@/lib/peppol/build";
import { buildInvoiceUBL } from "@/lib/peppol/ubl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFileName(input: string): string {
  return input.replace(/[^\w.\- ]+/g, "").trim() || "factuur";
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const factuurId = Number(id);
  const { supabase, companyId } = await getCompanyContext();
  if (!companyId || Number.isNaN(factuurId)) {
    return new Response("Niet gevonden", { status: 404 });
  }

  const peppol = await getPeppolConfig(supabase, companyId);
  const built = await buildFactuurUbl(supabase, companyId, factuurId, peppol);
  if (!built) return new Response("Niet gevonden", { status: 404 });

  const xml = buildInvoiceUBL(built.ubl);
  const fileName = safeFileName(`Peppol-Factuur-${built.nummer}`);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}.xml"`,
      "Cache-Control": "no-store",
    },
  });
}
