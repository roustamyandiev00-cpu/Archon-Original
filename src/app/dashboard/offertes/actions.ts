"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import {
  isOfferteEditable,
  lineTotals,
  offerteLineHasContent,
  statusMeta,
  type OfferteLijnInput,
  type OfferteStatus,
  validateOfferteInput,
} from "@/lib/offertes";
import { loadCompanyDefaultTemplate } from "@/components/dashboard/documenten/documentTemplate";
import { ensureProjectFromOfferte } from "@/lib/projecten/ensureFromOfferte";

export type CreateOfferteInput = {
  customerId: number | null;
  klant: string;
  datum: string;
  geldigTot: string | null;
  notes: string;
  lines: OfferteLijnInput[];
  projectNaam?: string | null;
  afmetingen?: string | null;
};

export type UpdateOfferteInput = CreateOfferteInput & { id: number };

export async function createOfferte(input: CreateOfferteInput) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const validationIssue = validateOfferteInput({
    klant: input.klant,
    datum: input.datum,
    geldigTot: input.geldigTot ?? "",
    lines: input.lines,
  })[0];
  if (validationIssue) return { error: validationIssue.message };

  if (input.customerId != null) {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", input.customerId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (customerError) return { error: "De klant kon niet worden gecontroleerd." };
    if (!customer) return { error: "De gekozen klant behoort niet tot dit bedrijf." };
  }

  const cleanLines = input.lines.filter(offerteLineHasContent);
  const { totaal } = lineTotals(cleanLines);
  const templateId = await loadCompanyDefaultTemplate(supabase, companyId, "quote");

  const year = new Date().getFullYear();

  // Bepaal het startnummer op basis van het hoogste bestaande offertenummer
  // van dit jaar (per bedrijf). Robuuster dan tellen: houdt rekening met
  // verwijderde offertes en gaten in de nummering.
  const { data: laatste } = await supabase
    .from("offertes")
    .select("nummer")
    .eq("bedrijf_id", companyId)
    .like("nummer", `OFF-${year}-%`)
    .order("nummer", { ascending: false })
    .limit(1)
    .maybeSingle();

  let seq = 1;
  if (laatste?.nummer) {
    const m = String(laatste.nummer).match(/(\d+)\s*$/);
    if (m) seq = parseInt(m[1], 10) + 1;
  }

  // Insert met retry: bij een uniek-conflict op het nummer schuiven we op
  // naar het volgende vrije nummer (bv. als de unique constraint globaal is).
  let offerte: { id: number; nummer: string } | null = null;
  let lastError: { message: string; code?: string } | null = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    const nummer = `OFF-${year}-${String(seq).padStart(4, "0")}`;
    const res = await supabase
      .from("offertes")
      .insert({
        nummer,
        klant: input.klant || "Onbekende klant",
        customer_id: input.customerId,
        bedrijf_id: companyId,
        user_id: user.id,
        bedrag: totaal,
        datum: input.datum,
        geldig_tot: input.geldigTot,
        notes: input.notes || null,
        project_naam: input.projectNaam?.trim() || null,
        afmetingen: input.afmetingen?.trim() || null,
        status: "Concept",
        status_new: "concept",
        template_id: templateId,
      })
      .select("id, nummer")
      .single();

    if (!res.error && res.data) {
      offerte = res.data as { id: number; nummer: string };
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

  if (!offerte) {
    return { error: lastError?.message ?? "Aanmaken mislukt." };
  }

  const lijnen = cleanLines.map((l, i) => ({
    offerte_id: offerte.id,
    company_id: companyId,
    omschrijving: l.omschrijving,
    aantal: Number(l.aantal) || 0,
    eenheid: l.eenheid || "stuks",
    prijs_per_eenheid: Number(l.prijs_per_eenheid) || 0,
    btw_percentage: Number(l.btw_percentage) || 0,
    sort_order: i,
  }));

  const { error: lineError } = await supabase
    .from("offerte_lijnen")
    .insert(lijnen);

  if (lineError) {
    return { error: lineError.message };
  }

  // Project wordt automatisch aangemaakt bij goedkeuring (geaccepteerd),
  // niet bij het aanmaken van de offerte.
  revalidatePath("/dashboard/offertes");
  revalidatePath("/dashboard/offertes/projecten");
  return {
    id: offerte.id as number,
    nummer: offerte.nummer,
  };
}

export async function updateOfferte(input: UpdateOfferteInput) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  // Haal de bestaande offerte op en controleer of die nog bewerkbaar is.
  const { data: bestaand } = await supabase
    .from("offertes")
    .select("id, status_new")
    .eq("id", input.id)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!bestaand) {
    return { error: "Offerte niet gevonden." };
  }
  if (!isOfferteEditable(bestaand.status_new)) {
    return {
      error: "Deze offerte is definitief bevestigd en kan niet meer bewerkt worden.",
    };
  }

  const validationIssue = validateOfferteInput({
    klant: input.klant,
    datum: input.datum,
    geldigTot: input.geldigTot ?? "",
    lines: input.lines,
  })[0];
  if (validationIssue) return { error: validationIssue.message };

  if (input.customerId != null) {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", input.customerId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (customerError) return { error: "De klant kon niet worden gecontroleerd." };
    if (!customer) return { error: "De gekozen klant behoort niet tot dit bedrijf." };
  }

  const cleanLines = input.lines.filter(offerteLineHasContent);
  const { totaal } = lineTotals(cleanLines);

  const { error: updateError } = await supabase
    .from("offertes")
    .update({
      klant: input.klant || "Onbekende klant",
      customer_id: input.customerId,
      bedrag: totaal,
      datum: input.datum,
      geldig_tot: input.geldigTot,
      notes: input.notes || null,
      project_naam: input.projectNaam?.trim() || null,
      afmetingen: input.afmetingen?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("bedrijf_id", companyId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Vervang de offertelijnen: verwijder de oude en voeg de nieuwe toe.
  const { error: deleteLinesError } = await supabase
    .from("offerte_lijnen")
    .delete()
    .eq("offerte_id", input.id)
    .eq("company_id", companyId);
  if (deleteLinesError) {
    return { error: "De bestaande offertelijnen konden niet worden vervangen." };
  }

  const lijnen = cleanLines.map((l, i) => ({
    offerte_id: input.id,
    company_id: companyId,
    omschrijving: l.omschrijving,
    aantal: Number(l.aantal) || 0,
    eenheid: l.eenheid || "stuks",
    prijs_per_eenheid: Number(l.prijs_per_eenheid) || 0,
    btw_percentage: Number(l.btw_percentage) || 0,
    sort_order: i,
  }));

  const { error: lineError } = await supabase
    .from("offerte_lijnen")
    .insert(lijnen);

  if (lineError) {
    return { error: lineError.message };
  }

  revalidatePath("/dashboard/offertes");
  revalidatePath(`/dashboard/offertes/${input.id}`);
  return { id: input.id };
}

export async function updateOfferteStatus(id: number, status: OfferteStatus) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;
  const patch: {
    status_new: OfferteStatus;
    status: string;
    updated_at: string;
    sent_at?: string;
    viewed_at?: string;
    accepted_at?: string;
    rejected_at?: string;
  } = {
    status_new: status,
    status: statusMeta(status).label,
    updated_at: new Date().toISOString(),
  };
  const nowIso = new Date().toISOString();
  if (status === "verzonden") patch.sent_at = nowIso;
  if (status === "bekeken") patch.viewed_at = nowIso;
  if (status === "geaccepteerd") patch.accepted_at = nowIso;
  if (status === "afgewezen") patch.rejected_at = nowIso;

  const { error } = await supabase
    .from("offertes")
    .update(patch)
    .eq("id", id)
    .eq("bedrijf_id", companyId);

  if (error) return { error: error.message };

  let projectId: string | undefined;
  if (status === "geaccepteerd") {
    const { data: offerte } = await supabase
      .from("offertes")
      .select(
        "id, klant, notes, datum, customer_id, converted_to_type, nummer, project_naam, afmetingen",
      )
      .eq("id", id)
      .eq("bedrijf_id", companyId)
      .maybeSingle();

    if (offerte) {
      const ensured = await ensureProjectFromOfferte({
        supabase,
        companyId,
        userId: user.id,
        offerte,
      });
      if (ensured.projectId) projectId = ensured.projectId;
    }
  }

  revalidatePath("/dashboard/offertes");
  revalidatePath(`/dashboard/offertes/${id}`);
  revalidatePath("/dashboard/offertes/projecten");
  if (projectId) {
    revalidatePath(`/dashboard/offertes/projecten/${projectId}`);
  }
  return { ok: true, projectId };
}

export async function deleteOfferte(id: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;
  await supabase
    .from("offerte_lijnen")
    .delete()
    .eq("offerte_id", id)
    .eq("company_id", companyId);
  const { error } = await supabase
    .from("offertes")
    .delete()
    .eq("id", id)
    .eq("bedrijf_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/offertes");
  return { ok: true };
}
