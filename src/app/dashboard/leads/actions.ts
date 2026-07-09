"use server";

import { revalidatePath } from "next/cache";
import { getCompanyContext } from "@/lib/company";
import { STADIA, type Stadium } from "@/components/dashboard/leads/stages";

function isStadium(value: string): value is Stadium {
  return (STADIA as readonly string[]).includes(value);
}

export async function moveDeal(dealId: number, stadium: string) {
  if (!isStadium(stadium)) return { error: "Onbekend stadium." };

  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) {
    return { error: "Je account is nog niet aan een bedrijf gekoppeld." };
  }

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

  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) {
    return { error: "Je account is nog niet aan een bedrijf gekoppeld." };
  }
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
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) return { error: "Niet ingelogd." };

  const { error } = await supabase
    .from("deals")
    .delete()
    .eq("id", dealId)
    .eq("bedrijf_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/leads");
  return { success: true };
}
