"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { STADIA, type Stadium } from "@/components/dashboard/leads/stages";
import type { Database } from "@/types/database.types";

type DealUpdate = Database["public"]["Tables"]["deals"]["Update"];

function isStadium(value: string): value is Stadium {
  return (STADIA as readonly string[]).includes(value);
}

export async function moveDeal(dealId: number, stadium: string) {
  if (!isStadium(stadium)) return { error: "Onbekend stadium." };

  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { error } = await supabase
    .from("deals")
    .update({ stadium, updated_at: new Date().toISOString() })
    .eq("id", dealId)
    .eq("bedrijf_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/leads");
  return { success: true };
}

export type CreateDealInput = {
  titel: string;
  stadium: string;
  waarde: number | null;
  kans: number | null;
};

export async function createDeal(input: CreateDealInput) {
  if (!isStadium(input.stadium)) return { error: "Onbekend stadium." };

  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;
  if (!input.titel.trim()) return { error: "Geef de deal een titel." };

  const { data, error } = await supabase
    .from("deals")
    .insert({
      titel: input.titel.trim(),
      stadium: input.stadium,
      waarde: input.waarde,
      kans: input.kans,
      bedrijf_id: companyId,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/leads");
  return { id: data.id as number };
}

export type UpdateDealInput = {
  titel?: string;
  waarde?: number | null;
  kans?: number | null;
  deadline?: string | null;
  contactpersoon?: string | null;
  telefoon?: string | null;
  email?: string | null;
  notitie?: string | null;
};

export async function updateDeal(dealId: number, input: UpdateDealInput) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  if (input.titel !== undefined && !input.titel.trim()) {
    return { error: "Geef de deal een titel." };
  }

  const patch: DealUpdate = { updated_at: new Date().toISOString() };
  if (input.titel !== undefined) patch.titel = input.titel.trim();
  if (input.waarde !== undefined) patch.waarde = input.waarde;
  if (input.kans !== undefined) patch.kans = input.kans;
  if (input.deadline !== undefined) patch.deadline = input.deadline;
  if (input.contactpersoon !== undefined)
    patch.contactpersoon = input.contactpersoon?.trim() || null;
  if (input.telefoon !== undefined) patch.telefoon = input.telefoon?.trim() || null;
  if (input.email !== undefined) patch.email = input.email?.trim() || null;
  if (input.notitie !== undefined) patch.notitie = input.notitie?.trim() || null;

  const { error } = await supabase
    .from("deals")
    .update(patch)
    .eq("id", dealId)
    .eq("bedrijf_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/leads");
  return { success: true };
}

export async function deleteDeal(dealId: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;
  const { error } = await supabase
    .from("deals")
    .delete()
    .eq("id", dealId)
    .eq("bedrijf_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/leads");
  return { success: true };
}
