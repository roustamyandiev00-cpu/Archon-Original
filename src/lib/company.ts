import { createClient } from "@/lib/supabase/server";

/**
 * Resolves the current authenticated user and their active company.
 * Returns the (server) Supabase client so callers can reuse it.
 */
export async function getCompanyContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, companyId: null as number | null };
  }

  const { data: membership } = await supabase
    .from("company_memberships")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return {
    supabase,
    user,
    companyId: (membership?.company_id ?? null) as number | null,
  };
}
