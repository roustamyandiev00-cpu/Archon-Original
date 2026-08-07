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

function clean(input: PrijslijstItemInput) {
  return {
    omschrijving: input.omschrijving.trim(),
    eenheid: (input.eenheid?.trim() || "stuks").slice(0, 40),
    prijs: Number(input.prijs) || 0,
    btw_percentage: Number(input.btwPercentage ?? 21) || 0,
    categorie: input.categorie?.trim() || null,
  };
}

export async function createPrijslijstItem(input: PrijslijstItemInput) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const row = clean(input);
  if (!row.omschrijving) return { error: "Omschrijving is verplicht." };
  if (row.prijs < 0) return { error: "Prijs mag niet negatief zijn." };

  const { data, error } = await supabase
    .from("prijslijst_items")
    .insert({
      company_id: companyId,
      created_by: user.id,
      ...row,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

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

  const row = clean(input);
  if (!row.omschrijving) return { error: "Omschrijving is verplicht." };
  if (row.prijs < 0) return { error: "Prijs mag niet negatief zijn." };

  const { error } = await supabase
    .from("prijslijst_items")
    .update({
      ...row,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/prijslijst");
  return { ok: true as const };
}

export async function setPrijslijstItemActive(id: number, isActive: boolean) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { error } = await supabase
    .from("prijslijst_items")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/prijslijst");
  return { ok: true as const };
}
