import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultAiConfig,
  parseExtras,
  type AiConfig,
} from "@/app/dashboard/instellingen/settings";
import { loadUserAgentName } from "@/lib/agents/userAi";

export async function loadCompanyAiConfig(
  supabase: SupabaseClient,
  companyId: number,
): Promise<AiConfig> {
  const { data } = await supabase
    .from("bedrijven")
    .select("ai_assistant")
    .eq("id", companyId)
    .maybeSingle();

  const extras = parseExtras(data?.ai_assistant ?? null);
  return { ...defaultAiConfig, ...extras.ai };
}

/** Bedrijfsinstellingen + persoonlijke agentnaam van de ingelogde gebruiker. */
export async function loadMergedAiConfig(
  supabase: SupabaseClient,
  companyId: number,
  userId: string,
): Promise<AiConfig> {
  const company = await loadCompanyAiConfig(supabase, companyId);
  const userAgentName = await loadUserAgentName(supabase, userId);
  return {
    ...company,
    agentNaam: userAgentName || company.agentNaam || defaultAiConfig.agentNaam,
  };
}
