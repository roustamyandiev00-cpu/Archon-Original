import { getCompanyContext } from "@/lib/company";
import { buildContractHtml } from "@/lib/pdf/contractTemplate";
import { htmlToPdf } from "@/lib/pdf";
import type { SamenwerkingContractDraft } from "@/lib/agents/contract";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId) {
    return new Response(JSON.stringify({ error: "Niet ingelogd." }), {
      status: 401,
    });
  }

  const { data: contract } = await supabase
    .from("samenwerking_contracts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!contract) {
    return new Response(JSON.stringify({ error: "Niet gevonden." }), {
      status: 404,
    });
  }

  if (
    companyId !== contract.party_a_company_id &&
    companyId !== contract.party_b_company_id
  ) {
    return new Response(JSON.stringify({ error: "Geen toegang." }), {
      status: 403,
    });
  }

  const companyIds = [contract.party_a_company_id, contract.party_b_company_id];
  const { data: bedrijven } = await supabase
    .from("bedrijven_directory")
    .select("id, naam")
    .in("id", companyIds);

  const naamMap = new Map<number, string>();
  for (const b of bedrijven ?? []) {
    if (b.id != null) naamMap.set(b.id, b.naam ?? `Bedrijf #${b.id}`);
  }

  const partyAName =
    naamMap.get(contract.party_a_company_id) ??
    `Bedrijf #${contract.party_a_company_id}`;
  const partyBName =
    naamMap.get(contract.party_b_company_id) ??
    `Bedrijf #${contract.party_b_company_id}`;

  const formatSignedAt = (iso: string) =>
    new Date(iso).toLocaleString("nl-BE", {
      dateStyle: "long",
      timeStyle: "short",
    });

  const html = buildContractHtml({
    draft: contract.draft_json as SamenwerkingContractDraft,
    partyAName,
    partyBName,
    partyASignature: contract.party_a_signed_at
      ? {
          companyName: partyAName,
          signerName: contract.party_a_signer_name ?? partyAName,
          signedAt: formatSignedAt(contract.party_a_signed_at),
        }
      : null,
    partyBSignature: contract.party_b_signed_at
      ? {
          companyName: partyBName,
          signerName: contract.party_b_signer_name ?? partyBName,
          signedAt: formatSignedAt(contract.party_b_signed_at),
        }
      : null,
  });

  const pdf = await htmlToPdf(html);
  const filename = `${contract.titel.replace(/[^\w\s-]/g, "").slice(0, 60)}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
