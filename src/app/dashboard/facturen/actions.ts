"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { notifySlackNewFactuur } from "@/components/dashboard/integraties/slackNotify";
import type { OfferteLijnInput } from "@/lib/offertes";
import { documentTypeMeta, type FactuurDocumentType } from "@/lib/facturen";
import { loadCompanyDefaultTemplate } from "@/components/dashboard/documenten/documentTemplate";
import { notifyPaymentReceived } from "@/lib/agents/events/payment-received";
import {
  isAllowedFactuurStatusTransition,
  validateCreateFactuurInput,
} from "@/lib/facturen/validation";

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

  const validated = validateCreateFactuurInput(input);
  if (!validated.ok) return { error: validated.error };
  const value = validated.value;

  if (value.customerId !== null) {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", value.customerId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (customerError) {
      return { error: "De klant kon niet worden gecontroleerd." };
    }
    if (!customer) return { error: "De gekozen klant behoort niet tot dit bedrijf." };
  }

  if (value.projectId !== null) {
    const { data: project, error: projectError } = await supabase
      .from("projecten")
      .select("id")
      .eq("id", value.projectId)
      .eq("bedrijf_id", companyId)
      .maybeSingle();
    if (projectError) {
      return { error: "Het project kon niet worden gecontroleerd." };
    }
    if (!project) return { error: "Het gekozen project behoort niet tot dit bedrijf." };
  }

  const { subtotaal, btw, totaal } = value.totals;
  const templateId = await loadCompanyDefaultTemplate(
    supabase,
    companyId,
    "invoice",
  );

  const year = new Date().getFullYear();
  const prefix = documentTypeMeta(value.documentType).prefix;

  // Startnummer op basis van het hoogste bestaande nummer van dit type/jaar.
  const { data: laatste } = await supabase
    .from("facturen")
    .select("nummer")
    .eq("bedrijf_id", companyId)
    .eq("document_type", value.documentType)
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
        klant: value.klant,
        customer_id: value.customerId,
        project_id: value.projectId,
        bedrijf_id: companyId,
        user_id: user.id,
        document_type: value.documentType,
        bedrag: subtotaal,
        btw_bedrag: btw,
        totaal_bedrag: totaal,
        datum: value.datum,
        vervaldatum: value.vervaldatum,
        omschrijving: value.omschrijving || null,
        notities: value.notities || null,
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
    console.error("[facturen] Factuurkop aanmaken mislukt", {
      companyId,
      code: lastError?.code,
      message: lastError?.message,
    });
    return { error: "De factuur kon niet worden aangemaakt." };
  }

  const lijnen = value.lines.map((l, i) => ({
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
    console.error("[facturen] Factuurregels aanmaken mislukt", {
      companyId,
      factuurId: factuur.id,
      code: lineError.code,
      message: lineError.message,
    });
    return { error: "De factuurregels konden niet worden opgeslagen." };
  }

  void notifySlackNewFactuur(supabase, companyId, {
    id: factuur.id,
    nummer: factuur.nummer,
    klant: value.klant,
    totaal,
    documentType: value.documentType,
  });

    revalidatePath("/dashboard/facturen");
    revalidatePath("/dashboard/facturen/lijst");
    revalidatePath("/dashboard/facturen/nieuw");
  return { id: factuur.id as number };
}

export async function markFactuurAsVerzonden(factuurId: number) {
  if (!Number.isInteger(factuurId) || factuurId <= 0) {
    return { error: "Ongeldige factuur." };
  }
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { data: factuur, error: factuurError } = await supabase
    .from("facturen")
    .select("id, nummer, status, sent_at, document_type")
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (factuurError) return { error: "De factuur kon niet worden gecontroleerd." };
  if (!factuur) return { error: "Factuur niet gevonden." };
  if (factuur.document_type === "proforma") {
    return { error: "Een proforma kan niet als verzonden worden gemarkeerd." };
  }
  if (factuur.status === "verzonden" || factuur.sent_at) {
    return { ok: true, alreadySent: true, nummer: factuur.nummer };
  }
  if (
    !isAllowedFactuurStatusTransition({
      documentType: factuur.document_type,
      currentStatus: factuur.status,
      nextStatus: "verzonden",
    })
  ) {
    return {
      error: "Alleen conceptfacturen kunnen als verzonden worden gemarkeerd.",
    };
  }

  const now = new Date().toISOString();
  const { data: updatedFactuur, error: updateError } = await supabase
    .from("facturen")
    .update({
      status: "verzonden",
      sent_at: now,
      updated_at: now,
    })
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .eq("status", "concept")
    .select("id")
    .maybeSingle();

  if (updateError) return { error: "De factuurstatus kon niet worden bijgewerkt." };
  if (!updatedFactuur) {
    return { error: "De factuurstatus is intussen gewijzigd. Vernieuw de pagina." };
  }

  revalidatePath("/dashboard/facturen");
  revalidatePath("/dashboard/facturen/lijst");
  revalidatePath(`/dashboard/facturen/${factuurId}`);
  revalidatePath("/dashboard/overzicht");

  return { ok: true, nummer: factuur.nummer };
}

export async function markFactuurAsPaid(factuurId: number) {
  if (!Number.isInteger(factuurId) || factuurId <= 0) {
    return { error: "Ongeldige factuur." };
  }
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const { data: factuur, error: factuurError } = await supabase
    .from("facturen")
    .select("id, nummer, klant, totaal_bedrag, status, paid_at, document_type")
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (factuurError) return { error: "De factuur kon niet worden gecontroleerd." };
  if (!factuur) return { error: "Factuur niet gevonden." };
  if (factuur.document_type === "proforma") {
    return { error: "Een proforma kan niet als betaald worden gemarkeerd." };
  }
  if (factuur.paid_at || factuur.status === "betaald") {
    return { ok: true, alreadyPaid: true };
  }
  if (
    !isAllowedFactuurStatusTransition({
      documentType: factuur.document_type,
      currentStatus: factuur.status,
      nextStatus: "betaald",
    })
  ) {
    return {
      error:
        "Markeer de factuur eerst als verzonden voordat je een betaling registreert.",
    };
  }

  const now = new Date().toISOString();
  const amount = Number(factuur.totaal_bedrag ?? 0);
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Het factuurbedrag is ongeldig." };
  }

  const { data: updatedFactuur, error: updateError } = await supabase
    .from("facturen")
    .update({
      status: "betaald",
      paid_at: now,
      updated_at: now,
    })
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .eq("status", factuur.status)
    .is("paid_at", null)
    .select("id")
    .maybeSingle();

  if (updateError) return { error: "De betaling kon niet worden geregistreerd." };
  if (!updatedFactuur) {
    return { error: "De factuurstatus is intussen gewijzigd. Vernieuw de pagina." };
  }

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
