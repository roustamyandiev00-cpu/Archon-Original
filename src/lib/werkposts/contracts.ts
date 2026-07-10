import type { SamenwerkingContractDraft } from "@/lib/agents/contract";

export type SamenwerkingContractRow = {
  id: string;
  channelId: string;
  titel: string;
  draftHtml: string;
  draftJson: SamenwerkingContractDraft;
  status: "draft" | "pending_signatures" | "signed" | "void";
  partyACompanyId: number;
  partyBCompanyId: number;
  partyASignedAt: string | null;
  partyBSignedAt: string | null;
  partyASignerName: string | null;
  partyBSignerName: string | null;
  pdfStoragePath: string | null;
  createdAt: string;
};

export function mapSamenwerkingContractRow(
  row: Record<string, unknown>,
): SamenwerkingContractRow {
  return {
    id: String(row.id),
    channelId: String(row.channel_id),
    titel: String(row.titel),
    draftHtml: String(row.draft_html),
    draftJson: (row.draft_json ?? {}) as SamenwerkingContractDraft,
    status: row.status as SamenwerkingContractRow["status"],
    partyACompanyId: Number(row.party_a_company_id),
    partyBCompanyId: Number(row.party_b_company_id),
    partyASignedAt: (row.party_a_signed_at as string | null) ?? null,
    partyBSignedAt: (row.party_b_signed_at as string | null) ?? null,
    partyASignerName: (row.party_a_signer_name as string | null) ?? null,
    partyBSignerName: (row.party_b_signer_name as string | null) ?? null,
    pdfStoragePath: (row.pdf_storage_path as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

/** Contract wacht op handtekening van dit bedrijf. */
export function contractNeedsMySignature(
  contract: SamenwerkingContractRow | null | undefined,
  companyId: number,
): boolean {
  if (!contract || contract.status !== "pending_signatures") return false;
  if (companyId === contract.partyACompanyId) return !contract.partyASignedAt;
  if (companyId === contract.partyBCompanyId) return !contract.partyBSignedAt;
  return false;
}

export function countContractsAwaitingSignature(
  contractsByChannel: Record<string, SamenwerkingContractRow>,
  companyId: number,
): number {
  return Object.values(contractsByChannel).filter((c) =>
    contractNeedsMySignature(c, companyId),
  ).length;
}
