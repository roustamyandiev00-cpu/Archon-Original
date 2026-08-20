/**
 * Bouwnetwerk / Samenwerkingen: bevroren MVP-modules.
 * Pas live voor eindgebruikers wanneer genoeg mensen geregistreerd zijn.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const BOUWNETWERK_REQUIRED_USERS = 100;

/** Fallback als de RPC niet bereikbaar is (offline / preview zonder sessie). */
export const BOUWNETWERK_FALLBACK_USERS = 0;

export function isBouwnetwerkUnlocked(
  currentUsers: number,
  requiredUsers = BOUWNETWERK_REQUIRED_USERS,
): boolean {
  return currentUsers >= requiredUsers;
}

export function bouwnetwerkProgressPercent(
  currentUsers: number,
  requiredUsers = BOUWNETWERK_REQUIRED_USERS,
): number {
  if (requiredUsers <= 0) return 100;
  return Math.min(Math.round((currentUsers / requiredUsers) * 100), 100);
}

export function bouwnetwerkSidebarHint(
  requiredUsers = BOUWNETWERK_REQUIRED_USERS,
): string {
  return `Nog in ontwikkeling — beschikbaar vanaf ${requiredUsers} gebruikers`;
}

/** @deprecated gebruik bouwnetwerkSidebarHint() */
export const BOUWNETWERK_SIDEBAR_HINT = bouwnetwerkSidebarHint();

/**
 * Echte platform-teller via SECURITY DEFINER RPC.
 * Geeft alleen een aggregate integer terug (geen klantdata).
 */
export async function fetchPlatformRegistrationCount(
  supabase: SupabaseClient,
): Promise<number> {
  const { data, error } = await supabase.rpc("get_platform_registration_count");
  if (error) {
    console.error("[bouwnetwerk-gate] registration count failed:", error.message);
    return BOUWNETWERK_FALLBACK_USERS;
  }
  const n = typeof data === "number" ? data : Number(data);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : BOUWNETWERK_FALLBACK_USERS;
}
