"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { notifySlackNewFactuur } from "@/components/dashboard/integraties/slackNotify";
import { lineTotals, type OfferteLijnInput } from "@/lib/offertes";
import { documentTypeMeta, type FactuurDocumentType } from "@/lib/facturen";
import { loadCompanyDefaultTemplate } from "@/components/dashboard/documenten/documentTemplate";
import { notifyPaymentReceived } from "@/lib/agents/events/payment-received";

export type CreateFactuurInput = {
  documentType: FactuurDocumentType;
  customerId: number | null;
  projectId?: string | null;
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
  const templateId = await loadCompanyDefaultTemplate(
    supabase,
    companyId,
    "invoice",
  );

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
  let factuur: { id: number; nummer: string } | null = null;
  let lastError: { message: string; code?: string } | null = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    const nummer = `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
    const res = await supabase
      .from("facturen")
      .insert({
        nummer,
        klant: input.klant || "Onbekende klant",
        customer_id: input.customerId,
        project_id: input.projectId || null,
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
        template_id: templateId,
      })
      .select("id, nummer")
      .single();

    if (!res.error && res.data) {
      factuur = res.data as { id: number; nummer: string };
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

  void notifySlackNewFactuur(supabase, companyId, {
    id: factuur.id,
    nummer: factuur.nummer,
    klant: input.klant || "Onbekende klant",
    totaal,
    documentType: input.documentType,
  });

    revalidatePath("/dashboard/facturen");
    revalidatePath("/dashboard/facturen/lijst");
    revalidatePath("/dashboard/facturen/nieuw");
  return { id: factuur.id as number };
}

const PAYABLE_STATUSES = new Set([
  "verzonden",
  "herinnerd",
  "vervallen",
  "deels_betaald",
]);

export async function markFactuurAsVerzonden(factuurId: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { data: factuur } = await supabase
    .from("facturen")
    .select("id, nummer, status, sent_at, document_type")
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!factuur) return { error: "Factuur niet gevonden." };
  if (factuur.document_type === "proforma") {
    return { error: "Een proforma kan niet als verzonden worden gemarkeerd." };
  }
  if (factuur.status === "verzonden" || factuur.sent_at) {
    return { ok: true, alreadySent: true, nummer: factuur.nummer };
  }
  if (factuur.status !== "concept") {
    return {
      error: "Alleen conceptfacturen kunnen als verzonden worden gemarkeerd.",
    };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("facturen")
    .update({
      status: "verzonden",
      sent_at: now,
      updated_at: now,
    })
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .eq("status", "concept");

  if (updateError) return { error: updateError.message };

  revalidatePath("/dashboard/facturen");
  revalidatePath("/dashboard/facturen/lijst");
  revalidatePath(`/dashboard/facturen/${factuurId}`);
  revalidatePath("/dashboard/overzicht");

  return { ok: true, nummer: factuur.nummer };
}

export async function markFactuurAsPaid(factuurId: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const { data: factuur } = await supabase
    .from("facturen")
    .select("id, nummer, klant, totaal_bedrag, status, paid_at, document_type")
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!factuur) return { error: "Factuur niet gevonden." };
  if (factuur.document_type === "proforma") {
    return { error: "Een proforma kan niet als betaald worden gemarkeerd." };
  }
  if (factuur.paid_at || factuur.status === "betaald") {
    return { ok: true, alreadyPaid: true };
  }
  if (factuur.status === "concept" || !PAYABLE_STATUSES.has(factuur.status ?? "")) {
    return {
      error:
        "Markeer de factuur eerst als verzonden voordat je een betaling registreert.",
    };
  }

  const now = new Date().toISOString();
  const amount = Number(factuur.totaal_bedrag ?? 0);

  const { error: updateError } = await supabase
    .from("facturen")
    .update({
      status: "betaald",
      paid_at: now,
      updated_at: now,
    })
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .is("paid_at", null);

  if (updateError) return { error: updateError.message };

  await supabase.from("betalingen").insert({
    bedrijf_id: companyId,
    factuur_id: factuurId,
    bedrag: amount,
    datum: now.slice(0, 10),
    betaalmethode: "handmatig",
    referentie: `Handmatig gemarkeerd door gebruiker`,
    user_id: user.id,
  });

  const notified = await notifyPaymentReceived(supabase, {
    tenantId: companyId,
    factuurId,
    amount,
    source: "manual",
    actorType: "user",
    actorId: user.id,
    referenceId: user.id,
    betaalmethode: "handmatig",
  });

  if ("error" in notified) {
    return { error: notified.error };
  }

  revalidatePath("/dashboard/facturen");
  revalidatePath("/dashboard/facturen/lijst");
  revalidatePath(`/dashboard/facturen/${factuurId}`);
  revalidatePath("/dashboard/automatisaties");
  revalidatePath("/dashboard/overzicht");

  return {
    ok: true,
    nummer: factuur.nummer,
    klant: factuur.klant,
  };
}
