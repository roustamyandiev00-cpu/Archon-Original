import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type BillitCredentials,
  confirmBillitInboxItem,
  fetchBillitFile,
  fetchBillitInbox,
} from "@/lib/billit/client";
import { getPeppolConfig, type PeppolConfig } from "@/lib/peppol/build";
import {
  classifyPeppolDocumentType,
  parseInboundUbl,
} from "@/lib/peppol/parse-inbound-ubl";
import { untyped } from "@/lib/integraties";

export type PeppolInboxRow = {
  id: number;
  bedrijf_id: number;
  external_inbox_item_id: string;
  peppol_file_id: string | null;
  document_type: string;
  sender_peppol_id: string | null;
  receiver_peppol_id: string | null;
  invoice_number: string | null;
  supplier_name: string | null;
  total_amount: number | null;
  currency: string;
  issue_date: string | null;
  status: string;
  received_at: string;
};

/** Billit-credentials uit Peppol-koppeling of standalone Billit-integratie. */
export async function getBillitCredentials(
  supabase: unknown,
  companyId: number,
): Promise<BillitCredentials | null> {
  const peppol = await getPeppolConfig(supabase, companyId);
  if (peppol?.accessPoint === "billit" && peppol.apiKey && peppol.partyId) {
    return {
      apiKey: peppol.apiKey,
      partyId: peppol.partyId,
      sandbox: peppol.sandbox,
    };
  }

  const { data } = await untyped(supabase)
    .from("integraties")
    .select("status, config")
    .eq("bedrijf_id", companyId)
    .eq("provider", "billit")
    .maybeSingle();

  if (!data || data.status !== "connected") return null;
  const c = (data.config ?? {}) as Record<string, string>;
  if (!c.apiKey?.trim()) return null;

  const partyId = c.partyId?.trim() || peppol?.partyId?.trim();
  if (!partyId) return null;

  return {
    apiKey: c.apiKey,
    partyId,
    sandbox: String(c.sandbox) === "true" || peppol?.sandbox,
  };
}

export function peppolConfigSupportsInbox(peppol: PeppolConfig): boolean {
  return Boolean(
    peppol?.accessPoint === "billit" && peppol.apiKey && peppol.partyId,
  );
}

export async function syncBillitPeppolInbox(
  supabaseClient: unknown,
  companyId: number,
): Promise<
  | { ok: true; imported: number; skipped: number }
  | { ok: false; error: string }
> {
  const creds = await getBillitCredentials(supabaseClient, companyId);
  if (!creds) {
    return {
      ok: false,
      error:
        "Billit is niet gekoppeld. Stel Peppol in met Billit als access point, of koppel Billit onder Integraties.",
    };
  }

  const inbox = await fetchBillitInbox(creds);
  if (!inbox.ok) return inbox;

  const supabase = untyped(supabaseClient) as SupabaseClient;
  let imported = 0;
  let skipped = 0;

  for (const item of inbox.items) {
    const externalId = String(item.InboxItemID);
    const { data: existing } = await supabase
      .from("peppol_inbox")
      .select("id")
      .eq("bedrijf_id", companyId)
      .eq("external_inbox_item_id", externalId)
      .maybeSingle();

    if (existing) {
      skipped += 1;
      continue;
    }

    const docClass = classifyPeppolDocumentType(item.PeppolDocumentType);
    let ublXml: string | null = null;
    let summary = {
      invoiceNumber: null as string | null,
      supplierName: null as string | null,
      totalAmount: null as number | null,
      currency: "EUR",
      issueDate: null as string | null,
      documentType: docClass === "unknown" ? "invoice" : docClass,
    };

    if (
      item.PeppolFileID &&
      (docClass === "invoice" || docClass === "creditnote")
    ) {
      const file = await fetchBillitFile(creds, item.PeppolFileID);
      if (file.ok) {
        ublXml = file.xml;
        const parsed = parseInboundUbl(file.xml);
        summary = {
          invoiceNumber: parsed.invoiceNumber,
          supplierName: parsed.supplierName,
          totalAmount: parsed.totalAmount,
          currency: parsed.currency,
          issueDate: parsed.issueDate,
          documentType:
            parsed.documentType === "unknown" ? docClass : parsed.documentType,
        };
      }
    }

    const { error } = await supabase.from("peppol_inbox").insert({
      bedrijf_id: companyId,
      external_inbox_item_id: externalId,
      peppol_file_id: item.PeppolFileID ?? null,
      document_type: summary.documentType,
      sender_peppol_id: item.SenderPeppolID ?? null,
      receiver_peppol_id: item.ReceiverPeppolID ?? null,
      invoice_number: summary.invoiceNumber,
      supplier_name: summary.supplierName,
      total_amount: summary.totalAmount,
      currency: summary.currency,
      issue_date: summary.issueDate,
      ubl_xml: ublXml,
      status: "ontvangen",
      access_point: "billit",
      received_at: item.CreationDate ?? new Date().toISOString(),
    });

    if (!error) imported += 1;
  }

  return { ok: true, imported, skipped };
}

export async function confirmPeppolInboxItem(
  supabaseClient: unknown,
  companyId: number,
  inboxId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = untyped(supabaseClient) as SupabaseClient;
  const { data: row } = await supabase
    .from("peppol_inbox")
    .select("external_inbox_item_id, status")
    .eq("id", inboxId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!row) return { ok: false, error: "Inbox-item niet gevonden." };

  const creds = await getBillitCredentials(supabaseClient, companyId);
  if (!creds) {
    return { ok: false, error: "Billit is niet gekoppeld." };
  }

  const confirm = await confirmBillitInboxItem(creds, row.external_inbox_item_id);
  if (!confirm.ok) return confirm;

  const now = new Date().toISOString();
  await supabase
    .from("peppol_inbox")
    .update({ status: "verwerkt", confirmed_at: now, updated_at: now })
    .eq("id", inboxId)
    .eq("bedrijf_id", companyId);

  return { ok: true };
}

export async function loadPeppolInbox(
  supabaseClient: unknown,
  companyId: number,
  limit = 30,
): Promise<PeppolInboxRow[]> {
  const supabase = untyped(supabaseClient) as SupabaseClient;
  const { data } = await supabase
    .from("peppol_inbox")
    .select(
      "id, bedrijf_id, external_inbox_item_id, peppol_file_id, document_type, sender_peppol_id, receiver_peppol_id, invoice_number, supplier_name, total_amount, currency, issue_date, status, received_at",
    )
    .eq("bedrijf_id", companyId)
    .order("received_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as PeppolInboxRow[];
}
