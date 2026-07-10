"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import {
  exportFacturenBatch,
  exportFactuurToProvider,
  listConnectedAccountingProviders,
  type AccountingProvider,
} from "@/lib/accounting/router";
import {
  confirmPeppolInboxItem,
  syncBillitPeppolInbox,
} from "@/lib/peppol/inbox";
import { untyped } from "@/lib/integraties";

export async function syncPeppolInboxAction() {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };

  const result = await syncBillitPeppolInbox(
    access.supabase,
    access.companyId,
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/e-facturen");
  return {
    ok: true,
    imported: result.imported,
    skipped: result.skipped,
    message:
      result.imported > 0
        ? `${result.imported} nieuw document${result.imported === 1 ? "" : "en"} opgehaald.`
        : "Geen nieuwe documenten in de Billit-inbox.",
  };
}

export async function confirmPeppolInboxItemAction(inboxId: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };

  const result = await confirmPeppolInboxItem(
    access.supabase,
    access.companyId,
    inboxId,
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/e-facturen");
  return { ok: true };
}

export async function setPeppolAutoSyncAction(enabled: boolean) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };

  const { data } = await untyped(access.supabase)
    .from("integraties")
    .select("config")
    .eq("bedrijf_id", access.companyId)
    .eq("provider", "peppol")
    .maybeSingle();

  if (!data) {
    return { error: "Peppol is niet gekoppeld. Stel eerst Billit in als access point." };
  }

  const config = (data.config ?? {}) as Record<string, string>;
  const { error } = await untyped(access.supabase)
    .from("integraties")
    .update({
      config: {
        ...config,
        autoSyncInbox: enabled ? "true" : "false",
      },
      updated_at: new Date().toISOString(),
    })
    .eq("bedrijf_id", access.companyId)
    .eq("provider", "peppol");

  if (error) return { error: error.message };

  revalidatePath("/dashboard/e-facturen");
  return { ok: true, enabled };
}

export async function exportFactuurToAccountingAction(
  factuurId: number,
  provider: AccountingProvider,
) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };

  const result = await exportFactuurToProvider(
    access.supabase,
    access.companyId,
    factuurId,
    provider,
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/boekhouding");
  revalidatePath("/dashboard/facturen");

  const exportId =
    "orderId" in result
      ? result.orderId
      : "entryId" in result
        ? result.entryId
        : "documentId" in result
          ? result.documentId
          : "onbekend";

  return { ok: true, exportId, provider };
}

export async function exportOpenFacturenAction(provider: AccountingProvider) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };

  const result = await exportFacturenBatch(
    access.supabase,
    access.companyId,
    provider,
  );

  revalidatePath("/dashboard/boekhouding");
  revalidatePath("/dashboard/facturen");

  const providerLabel =
    provider === "billit"
      ? "Billit"
      : provider === "exact-online"
        ? "Exact Online"
        : "Yuki";

  return {
    ok: true,
    exported: result.exported,
    failed: result.failed,
    message:
      result.exported > 0
        ? `${result.exported} factuur${result.exported === 1 ? "" : "en"} geëxporteerd naar ${providerLabel}.`
        : "Geen facturen om te exporteren.",
  };
}

export async function getAccountingProvidersAction() {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };

  const providers = await listConnectedAccountingProviders(
    access.supabase,
    access.companyId,
  );
  return { ok: true, providers };
}

// Backwards-compatible aliases
export async function exportFactuurToBillitAction(factuurId: number) {
  return exportFactuurToAccountingAction(factuurId, "billit");
}

export async function exportOpenFacturenToBillitAction() {
  return exportOpenFacturenAction("billit");
}
