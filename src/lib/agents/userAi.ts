import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/types/database.types";

export type UserAiPreferences = {
  agentNaam: string;
};

const DEFAULT_AGENT_NAME = "Nova";

export function parseUserAiPreferences(
  raw: Json | string | null | undefined,
): UserAiPreferences {
  if (!raw) return { agentNaam: DEFAULT_AGENT_NAME };
  try {
    const parsed =
      typeof raw === "string" ? JSON.parse(raw) : (raw as UserAiPreferences);
    if (parsed && typeof parsed === "object" && "agentNaam" in parsed) {
      const name = String(parsed.agentNaam ?? "").trim();
      return { agentNaam: name || DEFAULT_AGENT_NAME };
    }
  } catch {
    // ignore
  }
  return { agentNaam: DEFAULT_AGENT_NAME };
}

export const loadUserAgentName = cache(async function loadUserAgentName(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("ai_preferences")
    .eq("id", userId)
    .maybeSingle();

  return parseUserAiPreferences(data?.ai_preferences).agentNaam;
});

export async function saveUserAgentName(
  supabase: SupabaseClient,
  userId: string,
  agentNaam: string,
  email?: string | null,
) {
  const prefs: UserAiPreferences = {
    agentNaam: agentNaam.trim() || DEFAULT_AGENT_NAME,
  };

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("profiles")
      .update({
        ai_preferences: prefs as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    return error;
  }

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    email: email?.trim() || "",
    ai_preferences: prefs as unknown as Json,
  });
  return error;
}
