"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";

export type PrijslijstItemInput = {
  omschrijving: string;
  eenheid?: string;
  prijs: number;
  btwPercentage?: number;
  categorie?: string;
};

type CleanPrijslijstItem = {
  omschrijving: string;
  eenheid: string;
  prijs: number;
  btw_percentage: number;
  categorie: string | null;
};

type ValidationResult =
  | { ok: true; row: CleanPrijslijstItem }
  | { ok: false; error: string };

function validateId(id: number) {
  return Number.isSafeInteger(id) && id > 0;
}

function validateAndClean(input: PrijslijstItemInput): ValidationResult {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Ongeldige artikelgegevens." };
  }

  const omschrijving =
    typeof input.omschrijving === "string" ? input.omschrijving.trim() : "";
  if (!omschrijving) {
    return { ok: false, error: "Omschrijving is verplicht." };
  }

  if (input.eenheid != null && typeof input.eenheid !== "string") {
    return { ok: false, error: "Eenheid moet tekst zijn." };
  }
  const eenheid = input.eenheid?.trim() || "stuks";
  if (eenheid.length > 40) {
    return { ok: false, error: "Eenheid mag maximaal 40 tekens bevatten." };
  }

  if (typeof input.prijs !== "number" || !Number.isFinite(input.prijs)) {
    return { ok: false, error: "Prijs moet een geldig getal zijn." };
  }
  if (input.prijs < 0) {
    return { ok: false, error: "Prijs mag niet negatief zijn." };
  }

  const btwPercentage = input.btwPercentage ?? 21;
  if (typeof btwPercentage !== "number" || !Number.isFinite(btwPercentage)) {
    return { ok: false, error: "BTW-percentage moet een geldig getal zijn." };
  }
  if (btwPercentage < 0 || btwPercentage > 100) {
    return { ok: false, error: "BTW-percentage moet tussen 0 en 100 liggen." };
  }

  if (input.categorie != null && typeof input.categorie !== "string") {
    return { ok: false, error: "Categorie moet tekst zijn." };
  }

  return {
    ok: true,
    row: {
      omschrijving,
      eenheid,
      prijs: input.prijs,
      btw_percentage: btwPercentage,
      categorie: input.categorie?.trim() || null,
    },
  };
}

function databaseError(operation: string, error: { message: string }) {
  console.error(`[prijslijst] ${operation}:`, error.message);
  return { error: "De prijslijst kon niet worden opgeslagen. Probeer het opnieuw." };
}

export async function createPrijslijstItem(input: PrijslijstItemInput) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const validated = validateAndClean(input);
  if (!validated.ok) return { error: validated.error };

  const { data, error } = await supabase
    .from("prijslijst_items")
    .insert({
      company_id: companyId,
      created_by: user.id,
      ...validated.row,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return databaseError("create", error);
  if (!data) return { error: "Het nieuwe artikel kon niet worden bevestigd." };

  revalidatePath("/dashboard/prijslijst");
  return { ok: true as const, id: data.id as number };
}

export async function updatePrijslijstItem(
  id: number,
  input: PrijslijstItemInput,
) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  if (!validateId(id)) return { error: "Ongeldig artikelnummer." };
  const validated = validateAndClean(input);
  if (!validated.ok) return { error: validated.error };

  const { data, error } = await supabase
    .from("prijslijst_items")
    .update({
      ...validated.row,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .select("id")
    .maybeSingle();

  if (error) return databaseError("update", error);
  if (!data) return { error: "Artikel niet gevonden of geen toegang." };

  revalidatePath("/dashboard/prijslijst");
  return { ok: true as const };
}

export async function setPrijslijstItemActive(id: number, isActive: boolean) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  if (!validateId(id)) return { error: "Ongeldig artikelnummer." };
  if (typeof isActive !== "boolean") return { error: "Ongeldige artikelstatus." };

  const { data, error } = await supabase
    .from("prijslijst_items")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .select("id")
    .maybeSingle();

  if (error) return databaseError("set-active", error);
  if (!data) return { error: "Artikel niet gevonden of geen toegang." };

  revalidatePath("/dashboard/prijslijst");
  return { ok: true as const };
}
