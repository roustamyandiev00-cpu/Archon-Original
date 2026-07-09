import type { SupabaseClient } from "@supabase/supabase-js";
import { parseExtras } from "@/app/dashboard/instellingen/settings";
import {
  DEFAULT_AGENTS,
  mergeAgents,
  type CustomAgent,
} from "@/components/dashboard/agents/config";

export async function loadCompanyAgents(
  supabase: SupabaseClient,
  companyId: number | null,
): Promise<CustomAgent[]> {
  if (!companyId) return DEFAULT_AGENTS.map((a) => ({ ...a }));

  const { data } = await supabase
    .from("bedrijven")
    .select("ai_assistant")
    .eq("id", companyId)
    .maybeSingle();

  const extras = parseExtras(data?.ai_assistant ?? null);
  return mergeAgents(extras.agents);
}

export async function saveCompanyAgents(
  supabase: SupabaseClient,
  companyId: number,
  agents: CustomAgent[],
) {
  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select("ai_assistant")
    .eq("id", companyId)
    .maybeSingle();

  const extras = parseExtras(bedrijf?.ai_assistant ?? null);
  extras.agents = agents;

  const { error } = await supabase
    .from("bedrijven")
    .update({
      ai_assistant: JSON.stringify(extras),
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId);

  return error;
}
