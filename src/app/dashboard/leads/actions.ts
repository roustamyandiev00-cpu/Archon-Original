"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { STADIA, type Stadium } from "@/components/dashboard/leads/stages";

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
