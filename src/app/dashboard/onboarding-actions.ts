"use server";

import { revalidatePath } from "next/cache";
import { getCompanyContext } from "@/lib/company";
import { seedOnboardingFromMetadata } from "@/lib/onboarding/seed";
import {
  hasOnboardingAnswers,
  parseOnboardingProfile,
} from "@/lib/auth/registration";

/**
 * Past onboarding-antwoorden toe die client-side bewaard zijn
 * (bv. vóór Google/Apple OAuth in localStorage).
 */
export async function applyOnboardingProfile(profile: unknown) {
  const parsed = parseOnboardingProfile(profile);
  if (!parsed.success) return { error: parsed.error };

  const { supabase, companyId } = await getCompanyContext();
  if (!companyId) return { error: "Geen bedrijf gekoppeld." };

  if (!hasOnboardingAnswers(parsed.data)) {
    return { ok: true as const, skipped: true };
  }

  await seedOnboardingFromMetadata(supabase, companyId, {
    onboarding: parsed.data,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/instellingen");
  return { ok: true as const };
}
