"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { saveUserAgentName } from "@/lib/agents/userAi";
import { DEFAULT_TEMPLATE, parseExtras, type Extras, type SettingsInput } from "./settings";

const num = (v: number, fallback = 0) =>
  Number.isFinite(v) && v >= 0 ? v : fallback;

const TEMPLATE_BUCKET = "documents";
const MAX_TEMPLATE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
const LOGO_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

export async function updateSettings(input: SettingsInput) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  if (!input.naam.trim()) {
    return { error: "Bedrijfsnaam is verplicht." };
  }

  const userAgentError = await saveUserAgentName(
    supabase,
    user.id,
    input.ai.agentNaam,
    user.email,
  );
  if (userAgentError) return { error: userAgentError.message };

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select("ai_assistant")
    .eq("id", companyId)
    .maybeSingle();
  const oldExtras = parseExtras(bedrijf?.ai_assistant ?? null);
  const currentTokens = oldExtras.ai.tokens ?? 15000;

  const extras: Extras = {
    ai: {
      agentNaam: "Nova",
      vakgebied: input.ai.vakgebied.trim(),
      toon: input.ai.toon,
      toestemming: input.ai.toestemming,
      betalingsherinneringen: input.ai.betalingsherinneringen,
      instructies: input.ai.instructies.trim(),
      tokens: currentTokens,
    },
    standaardBtw: num(input.standaardBtw, 21),
    agents: oldExtras.agents,
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
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/offertes/nieuw");
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
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;
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

/**
 * Slaat het gekozen sjabloon op bij één specifieke offerte of factuur
 * (kolom `template_id`), zodat dat document dit sjabloon blijft gebruiken.
 */
export async function saveDocumentTemplate(
  kind: "quote" | "invoice",
  id: number,
  value: string,
) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;
  if (kind !== "quote" && kind !== "invoice") {
    return { error: "Ongeldig documenttype." };
  }
  if (!Number.isFinite(id)) {
    return { error: "Ongeldig document." };
  }
  const clean = (value || "").trim() || DEFAULT_TEMPLATE;
  const table = kind === "quote" ? "offertes" : "facturen";

  const { error } = await supabase
    .from(table)
    .update({ template_id: clean, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("bedrijf_id", companyId);

  if (error) return { error: error.message };

  revalidatePath(
    kind === "quote"
      ? `/dashboard/offertes/${id}`
      : `/dashboard/facturen/${id}`,
  );
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
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

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

/** Uploadt een bedrijfslogo naar Storage en slaat de publieke URL op. */
export async function uploadLogo(formData: FormData) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Geen bestand gekozen." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { error: "Logo is te groot (max. 2 MB)." };
  }
  if (file.type && !LOGO_MIME_TYPES.has(file.type)) {
    return {
      error: "Alleen afbeeldingen zijn toegestaan (PNG, JPG, WebP, SVG of GIF).",
    };
  }

  const path = `logos/${companyId}/logo-${Date.now()}-${slugify(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(TEMPLATE_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });

  if (uploadError) {
    return { error: `Uploaden mislukt: ${uploadError.message}` };
  }

  const { data: pub } = supabase.storage
    .from(TEMPLATE_BUCKET)
    .getPublicUrl(path);
  const url = pub.publicUrl;

  const { error: updateError } = await supabase
    .from("bedrijven")
    .update({ logo_url: url, updated_at: new Date().toISOString() })
    .eq("id", companyId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/dashboard/instellingen");
  return { url };
}

/** Verwijdert het bedrijfslogo uit de instellingen. */
export async function clearLogo() {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { error } = await supabase
    .from("bedrijven")
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq("id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/instellingen");
  return { ok: true };
}

export async function buyAiTokens(amount: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select("ai_assistant")
    .eq("id", companyId)
    .maybeSingle();

  const extras = parseExtras(bedrijf?.ai_assistant ?? null);
  const currentTokens = extras.ai.tokens ?? 15000;
  const newTokens = currentTokens + amount;

  extras.ai.tokens = newTokens;

  const { error } = await supabase
    .from("bedrijven")
    .update({
      ai_assistant: JSON.stringify(extras),
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/instellingen");
  return { ok: true, newTokens };
}
