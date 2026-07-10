"use server";

import { createClient } from "@/lib/supabase/server";
import { provisionWorkspaceIfNeeded } from "@/lib/company";
import { seedOnboardingFromMetadata } from "@/lib/onboarding/seed";

/** Werkruimte + onboarding na registratie (e-mail of OAuth met directe sessie). */
export async function finalizeNewAccount(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const companyId = await provisionWorkspaceIfNeeded(supabase);
  if (!companyId) return;

  await seedOnboardingFromMetadata(
    supabase,
    companyId,
    user.user_metadata as Record<string, unknown>,
  );
}

/** @deprecated Gebruik finalizeNewAccount */
export async function seedOnboardingAfterSignup(): Promise<void> {
  return finalizeNewAccount();
}
