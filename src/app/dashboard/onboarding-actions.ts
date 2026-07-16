"use server";

import { revalidatePath } from "next/cache";
import { getCompanyContext } from "@/lib/company";
import { seedOnboardingFromMetadata } from "@/lib/onboarding/seed";

/**
 * Past onboarding-antwoorden toe die client-side bewaard zijn
 * (bv. vóór Google/Apple OAuth in localStorage).
 */
export async function applyOnboardingProfile(profile: {
  vakgebied?: string;
  teamSize?: string;
  uitdaging?: string;
  doel?: string;
  intent?: string;
}) {
  const { supabase, companyId } = await getCompanyContext();
  if (!companyId) return { error: "Geen bedrijf gekoppeld." };

  if (!profile.vakgebied && !profile.uitdaging && !profile.doel) {
    return { ok: true as const, skipped: true };
  }

  await seedOnboardingFromMetadata(supabase, companyId, {
    onboarding: profile,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/instellingen");
  return { ok: true as const };
}
