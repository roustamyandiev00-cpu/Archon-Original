"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { matchBankTransactions } from "@/lib/bank/matching";
import { parseBankStatement } from "@/lib/bank/parse-statement";
import { untyped } from "@/lib/integraties";

export async function importBankStatementAction(formData: FormData) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };

  const file = formData.get("file");
  const iban = String(formData.get("iban") ?? "").replace(/\s+/g, "").toUpperCase();
  if (!(file instanceof File)) return { error: "Kies een bankbestand." };
  if (!iban) return { error: "Vul een IBAN in." };

  const content = await file.text();
  const rows = parseBankStatement(file.name, content);
  if (rows.length === 0) {
    return { error: "Geen transacties herkend in dit bestand (CSV of CAMT.053)." };
  }

  const now = new Date().toISOString();
  const { data: rekening } = await untyped(access.supabase)
    .from("bank_rekeningen")
    .upsert(
      {
        bedrijf_id: access.companyId,
        iban,
        alias: iban.slice(-4),
        updated_at: now,
      },
      { onConflict: "bedrijf_id,iban" },
    )
    .select("id")
    .maybeSingle();

  const rekeningId = rekening?.id ?? null;
  let imported = 0;

  for (const row of rows) {
    const { error } = await untyped(access.supabase)
      .from("bank_transacties")
      .upsert(
        {
          bedrijf_id: access.companyId,
          rekening_id: rekeningId,
          transactie_datum: row.datum,
          bedrag: row.bedrag,
          tegenpartij: row.tegenpartij,
          omschrijving: row.omschrijving,
          gestructureerde_mededeling: row.gestructureerde_mededeling,
          extern_referentie: row.extern_referentie,
          match_status: "open",
          updated_at: now,
        },
        { onConflict: "bedrijf_id,extern_referentie", ignoreDuplicates: true },
      );
    if (!error) imported += 1;
  }

  revalidatePath("/dashboard/boekhouding");
  return {
    ok: true,
    imported,
    total: rows.length,
    message: `${imported} nieuwe transactie${imported === 1 ? "" : "s"} geïmporteerd.`,
  };
}

export async function matchBankPaymentsAction() {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };

  const result = await matchBankTransactions(
    access.supabase,
    access.companyId,
  );

  revalidatePath("/dashboard/boekhouding");
  revalidatePath("/dashboard/facturen");

  return {
    ok: true,
    matched: result.matched,
    open: result.open,
    message:
      result.matched > 0
        ? `${result.matched} betaling${result.matched === 1 ? "" : "en"} gekoppeld aan facturen.`
        : "Geen nieuwe matches gevonden.",
  };
}

export async function addBankAccountAction(iban: string, alias?: string) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };

  const normalized = iban.replace(/\s+/g, "").toUpperCase();
  if (normalized.length < 15) return { error: "Ongeldig IBAN." };

  const { error } = await untyped(access.supabase).from("bank_rekeningen").upsert(
    {
      bedrijf_id: access.companyId,
      iban: normalized,
      alias: alias?.trim() || normalized.slice(-4),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "bedrijf_id,iban" },
  );

  if (error) return { error: error.message };
  revalidatePath("/dashboard/boekhouding");
  return { ok: true };
}
