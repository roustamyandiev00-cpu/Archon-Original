"use server";

import { revalidatePath } from "next/cache";
import { getCompanyContext } from "@/lib/company";
import { DEFAULT_TEMPLATE, type Extras, type SettingsInput } from "./settings";

const num = (v: number, fallback = 0) =>
  Number.isFinite(v) && v >= 0 ? v : fallback;

const TEMPLATE_BUCKET = "documents";
const MAX_TEMPLATE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function updateSettings(input: SettingsInput) {
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) {
    return { error: "Geen actief bedrijf gevonden." };
  }

  if (!input.naam.trim()) {
    return { error: "Bedrijfsnaam is verplicht." };
  }

  const extras: Extras = {
    ai: {
      agentNaam: input.ai.agentNaam.trim() || "Nova",
      vakgebied: input.ai.vakgebied.trim(),
      toon: input.ai.toon,
      toestemming: input.ai.toestemming,
      betalingsherinneringen: input.ai.betalingsherinneringen,
      instructies: input.ai.instructies.trim(),
    },
    standaardBtw: num(input.standaardBtw, 21),
  };

  const patch = {
    naam: input.naam.trim(),
    adres: input.adres.trim() || null,
    postcode: input.postcode.trim() || null,
    stad: input.stad.trim() || null,
    telefoon: input.telefoon.trim() || null,
    email: input.email.trim() || null,
    kvk: input.kvk.trim() || null,
    btw: input.btw.trim() || null,
    iban: input.iban.trim() || null,
    logo_url: input.logo_url.trim() || null,
    betaalterm: num(input.betaalterm, 30),
    algemene_voorwaarden: input.algemene_voorwaarden.trim() || null,
    footer_tekst: input.footer_tekst.trim() || null,
    default_quote_template: input.quoteTemplate || DEFAULT_TEMPLATE,
    default_invoice_template: input.invoiceTemplate || DEFAULT_TEMPLATE,
    ai_assistant: JSON.stringify(extras),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("bedrijven")
    .update(patch)
    .eq("id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/instellingen");
  return { ok: true };
}

/**
 * Slaat het gekozen sjabloon op als standaard voor offertes of facturen.
 * Wordt gebruikt vanaf de offerte-/factuurdetailpagina zodat de keuze bewaard
 * blijft voor volgende documenten.
 */
export async function saveDefaultTemplate(
  soort: "quote" | "invoice",
  value: string,
) {
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) {
    return { error: "Geen actief bedrijf gevonden." };
  }
  if (soort !== "quote" && soort !== "invoice") {
    return { error: "Ongeldig documenttype." };
  }
  const clean = (value || "").trim() || DEFAULT_TEMPLATE;

  const now = new Date().toISOString();
  const patch =
    soort === "quote"
      ? { default_quote_template: clean, updated_at: now }
      : { default_invoice_template: clean, updated_at: now };

  const { error } = await supabase
    .from("bedrijven")
    .update(patch)
    .eq("id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/instellingen");
  revalidatePath("/dashboard/offertes");
  revalidatePath("/dashboard/facturen");
  return { ok: true };
}

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w.\- ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60) || "sjabloon";

/**
 * Uploadt een eigen sjabloonbestand naar Storage en zet het als het
 * standaardsjabloon voor het gekozen documenttype. Retourneert de nieuwe
 * waarde ("upload:<pad>") zodat het formulier die kan tonen.
 */
export async function uploadTemplate(formData: FormData) {
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) {
    return { error: "Geen actief bedrijf gevonden." };
  }

  const soort = String(formData.get("soort") || "");
  if (soort !== "quote" && soort !== "invoice") {
    return { error: "Ongeldig documenttype." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Geen bestand gekozen." };
  }
  if (file.size > MAX_TEMPLATE_BYTES) {
    return { error: "Bestand is te groot (max. 10 MB)." };
  }

  const path = `sjablonen/${companyId}/${soort}-${Date.now()}-${slugify(
    file.name,
  )}`;

  const { error: uploadError } = await supabase.storage
    .from(TEMPLATE_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });

  if (uploadError) {
    return { error: `Uploaden mislukt: ${uploadError.message}` };
  }

  const value = `upload:${TEMPLATE_BUCKET}/${path}`;
  const now = new Date().toISOString();
  const patch =
    soort === "quote"
      ? { default_quote_template: value, updated_at: now }
      : { default_invoice_template: value, updated_at: now };

  const { error: updateError } = await supabase
    .from("bedrijven")
    .update(patch)
    .eq("id", companyId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/dashboard/instellingen");
  return { value, fileName: file.name };
}
