import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/types/database.types";

export type UserAiPreferences = {
  agentNaam: string;
};

export const DEFAULT_AGENT_NAME = "Lima";

/** Migreer oude standaardnaam naar Lima. */
export function normalizeAgentName(name: string | null | undefined): string {
  const trimmed = String(name ?? "").trim();
  if (!trimmed || trimmed === "Nova") return DEFAULT_AGENT_NAME;
  return trimmed;
}

export function parseUserAiPreferences(
  raw: Json | string | null | undefined,
): UserAiPreferences {
  if (!raw) return { agentNaam: DEFAULT_AGENT_NAME };
  try {
    const parsed =
      typeof raw === "string" ? JSON.parse(raw) : (raw as UserAiPreferences);
    if (parsed && typeof parsed === "object" && "agentNaam" in parsed) {
      const name = normalizeAgentName(parsed.agentNaam);
      return { agentNaam: name };
    }
  } catch {
    // ignore
  }
  return { agentNaam: DEFAULT_AGENT_NAME };
}

export async function loadUserDisplayName(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();

  const full = data?.full_name?.trim();
  if (full) return full.split(/\s+/)[0] ?? full;

  const email = data?.email?.trim();
  if (email) return email.split("@")[0] ?? "daar";

  return "daar";
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
