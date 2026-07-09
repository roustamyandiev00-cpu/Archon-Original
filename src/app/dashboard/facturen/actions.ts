"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { lineTotals, type OfferteLijnInput } from "@/lib/offertes";
import { documentTypeMeta, type FactuurDocumentType } from "@/lib/facturen";

export type CreateFactuurInput = {
  documentType: FactuurDocumentType;
  customerId: number | null;
  klant: string;
  datum: string;
  vervaldatum: string | null;
  omschrijving: string;
  notities: string;
  lines: OfferteLijnInput[];
};

export async function createFactuur(input: CreateFactuurInput) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const cleanLines = input.lines.filter(
    (l) => l.omschrijving.trim() !== "" || Number(l.prijs_per_eenheid) > 0,
  );
  if (cleanLines.length === 0) {
    return { error: "Voeg minstens één factuurlijn toe." };
  }

  const { subtotaal, btw, totaal } = lineTotals(cleanLines);

  const year = new Date().getFullYear();
  const prefix = documentTypeMeta(input.documentType).prefix;

  // Startnummer op basis van het hoogste bestaande nummer van dit type/jaar.
  const { data: laatste } = await supabase
    .from("facturen")
    .select("nummer")
    .eq("bedrijf_id", companyId)
    .eq("document_type", input.documentType)
    .like("nummer", `${prefix}-${year}-%`)
    .order("nummer", { ascending: false })
    .limit(1)
    .maybeSingle();

  let seq = 1;
  if (laatste?.nummer) {
    const m = String(laatste.nummer).match(/(\d+)\s*$/);
    if (m) seq = parseInt(m[1], 10) + 1;
  }

  // Insert met retry: bij een uniek-conflict op het nummer schuiven we op
  // naar het volgende vrije nummer (unique constraint op nummer is globaal).
  let factuur: { id: number } | null = null;
  let lastError: { message: string; code?: string } | null = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    const nummer = `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
    const res = await supabase
      .from("facturen")
      .insert({
        nummer,
        klant: input.klant || "Onbekende klant",
        customer_id: input.customerId,
        bedrijf_id: companyId,
        user_id: user.id,
        document_type: input.documentType,
        bedrag: subtotaal,
        btw_bedrag: btw,
        totaal_bedrag: totaal,
        datum: input.datum,
        vervaldatum: input.vervaldatum,
        omschrijving: input.omschrijving || null,
        notities: input.notities || null,
        status: "concept",
      })
      .select("id")
      .single();

    if (!res.error && res.data) {
      factuur = res.data as { id: number };
      lastError = null;
      break;
    }
    lastError = res.error;
    if (res.error?.code === "23505") {
      seq += 1;
      continue;
    }
    break;
  }

  if (!factuur) {
    return { error: lastError?.message ?? "Aanmaken mislukt." };
  }

  const lijnen = cleanLines.map((l, i) => ({
    factuur_id: factuur.id,
    company_id: companyId,
    omschrijving: l.omschrijving,
    aantal: Number(l.aantal) || 0,
    eenheid: l.eenheid || "stuks",
    prijs_per_eenheid: Number(l.prijs_per_eenheid) || 0,
    btw_percentage: Number(l.btw_percentage) || 0,
    sort_order: i,
  }));

  const { error: lineError } = await supabase
    .from("factuur_lijnen")
    .insert(lijnen);

  if (lineError) {
    return { error: lineError.message };
  }

  revalidatePath("/dashboard/facturen");
  return { id: factuur.id as number };
}
