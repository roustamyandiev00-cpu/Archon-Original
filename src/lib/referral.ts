import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type AppSupabase = SupabaseClient<Database>;

/** Initialen uit naam — bv. "Jan De Vries" → "JDV". */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts
      .slice(0, 3)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  const single = parts[0] ?? "";
  return (single.slice(0, 2).toUpperCase() || "AP");
}

export function buildReferralRegisterUrl(
  code: string,
  origin = "https://archonpro.be",
): string {
  return `${origin.replace(/\/$/, "")}/register?ref=${encodeURIComponent(code)}`;
}

export async function ensureUserReferral(
  supabase: AppSupabase,
  opts?: { fullName?: string | null; referredBy?: string | null },
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("ensure_user_referral", {
    p_user_id: user.id,
    p_full_name: opts?.fullName?.trim() || undefined,
    p_referred_by: opts?.referredBy?.trim().toUpperCase() || undefined,
  });

  if (error) {
    console.error("ensure_user_referral:", error.message);
    return null;
  }

  return typeof data === "string" ? data : null;
}

export async function loadUserReferralCode(
  supabase: AppSupabase,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  return data?.referral_code ?? null;
}
