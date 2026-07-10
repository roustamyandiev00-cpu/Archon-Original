import { exportFactuurToBillit } from "@/lib/billit/export-order";
import { exportFactuurToExact, exportFactuurToYuki } from "@/lib/accounting/export";
import { getBillitCredentials } from "@/lib/peppol/inbox";

export type AccountingProvider = "billit" | "exact-online" | "yuki";

export async function exportFactuurToProvider(
  supabase: unknown,
  companyId: number,
  factuurId: number,
  provider: AccountingProvider,
) {
  switch (provider) {
    case "billit": {
      const creds = await getBillitCredentials(supabase, companyId);
      if (!creds) {
        return {
          ok: false as const,
          error: "Billit is niet gekoppeld.",
        };
      }
      return exportFactuurToBillit(supabase, companyId, factuurId, creds);
    }
    case "exact-online":
      return exportFactuurToExact(supabase, companyId, factuurId);
    case "yuki":
      return exportFactuurToYuki(supabase, companyId, factuurId);
    default:
      return { ok: false as const, error: "Onbekende provider." };
  }
}

export async function exportFacturenBatch(
  supabase: unknown,
  companyId: number,
  provider: AccountingProvider,
  factuurIds?: number[],
) {
  const { untyped } = await import("@/lib/integraties");
  let query = untyped(supabase)
    .from("facturen")
    .select("id")
    .eq("bedrijf_id", companyId)
    .is("accounting_export_id", null)
    .neq("status", "concept")
    .order("created_at", { ascending: false })
    .limit(25);

  if (factuurIds?.length) query = query.in("id", factuurIds);

  const { data: rows } = await query;
  const ids = (rows ?? []).map((r: { id: number }) => r.id);
  const failed: { id: number; error: string }[] = [];
  let exported = 0;

  for (const id of ids) {
    const res = await exportFactuurToProvider(
      supabase,
      companyId,
      id,
      provider,
    );
    if (res.ok) exported += 1;
    else failed.push({ id, error: res.error });
  }

  return { ok: true as const, exported, failed };
}

export async function listConnectedAccountingProviders(
  supabase: unknown,
  companyId: number,
): Promise<AccountingProvider[]> {
  const { untyped } = await import("@/lib/integraties");
  const { getBillitCredentials } = await import("@/lib/peppol/inbox");

  const providers: AccountingProvider[] = [];
  if (await getBillitCredentials(supabase, companyId)) {
    providers.push("billit");
  }

  const { data } = await untyped(supabase)
    .from("integraties")
    .select("provider, status")
    .eq("bedrijf_id", companyId)
    .in("provider", ["exact-online", "yuki"]);

  for (const row of data ?? []) {
    if (row.status === "connected") {
      providers.push(row.provider as AccountingProvider);
    }
  }

  return providers;
}
