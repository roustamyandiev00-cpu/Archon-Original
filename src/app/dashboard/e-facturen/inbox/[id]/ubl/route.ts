import { getCompanyContext } from "@/lib/company";
import { untyped } from "@/lib/integraties";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const inboxId = Number(id);
  if (!Number.isFinite(inboxId)) {
    return new Response("Ongeldig ID", { status: 400 });
  }

  const { supabase, companyId } = await getCompanyContext();
  if (!companyId) {
    return new Response("Geen bedrijf", { status: 403 });
  }

  const { data } = await untyped(supabase)
    .from("peppol_inbox")
    .select("ubl_xml, invoice_number, document_type")
    .eq("id", inboxId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!data?.ubl_xml) {
    return new Response("UBL niet beschikbaar", { status: 404 });
  }

  const filename = `${data.invoice_number ?? `inbox-${inboxId}`}.xml`;
  return new Response(data.ubl_xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
