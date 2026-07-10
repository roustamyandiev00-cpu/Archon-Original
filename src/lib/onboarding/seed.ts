import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultAiConfig,
  parseExtras,
} from "@/app/dashboard/instellingen/settings";
import type { Database } from "@/types/database.types";

type AppSupabase = SupabaseClient<Database>;

type OnboardingMeta = {
  vakgebied?: string;
  teamSize?: string;
  uitdaging?: string;
  doel?: string;
  intent?: string;
};

const TEAM_LABELS: Record<string, string> = {
  solo: "eenmanszaak",
  klein: "2–5 medewerkers",
  middel: "6–15 medewerkers",
  groot: "16+ medewerkers",
};

function buildOnboardingInstructions(data: OnboardingMeta): string {
  const parts: string[] = [];
  if (data.uitdaging) parts.push(`Grootste uitdaging: ${data.uitdaging}.`);
  if (data.teamSize) {
    parts.push(`Teamgrootte: ${TEAM_LABELS[data.teamSize] ?? data.teamSize}.`);
  }
  if (data.doel || data.intent) {
    parts.push(`Primair doel: ${data.doel ?? data.intent}.`);
  }
  return parts.join(" ");
}

/**
 * Zet onboarding-antwoorden uit user_metadata door naar ai_assistant
 * zodat Nova het bedrijf meteen kent na registratie.
 */
export async function seedOnboardingFromMetadata(
  supabase: AppSupabase,
  companyId: number,
  metadata: Record<string, unknown> | undefined,
): Promise<void> {
  const onboarding = metadata?.onboarding as OnboardingMeta | undefined;
  if (!onboarding?.vakgebied && !onboarding?.uitdaging) return;

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
