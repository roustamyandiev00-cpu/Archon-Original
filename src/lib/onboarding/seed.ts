import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultAiConfig,
  parseExtras,
} from "@/app/dashboard/instellingen/settings";
import type { Database } from "@/types/database.types";
import {
  getTeamSizeInstructionLabel,
  hasOnboardingAnswers,
  parseOnboardingProfile,
  type OnboardingProfile,
} from "@/lib/auth/registration";

type AppSupabase = SupabaseClient<Database>;

function buildOnboardingInstructions(data: OnboardingProfile): string {
  const parts: string[] = [];
  if (data.uitdaging) parts.push(`Grootste uitdaging: ${data.uitdaging}.`);
  if (data.teamSize) {
    parts.push(`Teamgrootte: ${getTeamSizeInstructionLabel(data.teamSize)}.`);
  }
  if (data.doel || data.intent) {
    parts.push(`Primair doel: ${data.doel ?? data.intent}.`);
  }
  return parts.join(" ");
}

/**
 * Zet onboarding-antwoorden uit user_metadata door naar ai_assistant
 * zodat Ela het bedrijf meteen kent na registratie.
 */
export async function seedOnboardingFromMetadata(
  supabase: AppSupabase,
  companyId: number,
  metadata: Record<string, unknown> | undefined,
): Promise<void> {
  const parsed = parseOnboardingProfile(metadata?.onboarding);
  if (!parsed.success || !hasOnboardingAnswers(parsed.data)) return;
  const onboarding = parsed.data;

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select("ai_assistant")
    .eq("id", companyId)
    .maybeSingle();

  const extras = parseExtras(bedrijf?.ai_assistant ?? null);
  const instructions = buildOnboardingInstructions(onboarding);

  extras.ai = {
    ...defaultAiConfig,
    ...extras.ai,
    vakgebied: onboarding.vakgebied ?? extras.ai.vakgebied,
    instructies: [extras.ai.instructies, instructions].filter(Boolean).join("\n"),
  };

  await supabase
    .from("bedrijven")
    .update({ ai_assistant: JSON.stringify(extras) })
    .eq("id", companyId);
}
