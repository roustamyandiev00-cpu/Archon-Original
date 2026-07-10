import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { withReadOnlyGuard } from "@/lib/supabase/readonly-guard";
import { getImpersonationContext } from "@/lib/impersonation";
import type { Database } from "@/types/database.types";

type AppSupabase = SupabaseClient<Database>;

async function loadActiveCompanyId(
  supabase: AppSupabase,
  userId: string,
): Promise<number | null> {
  const { data: membership } = await supabase
    .from("company_memberships")
    .select("company_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return membership?.company_id ?? null;
}

/**
 * Maakt voor ingelogde users zonder bedrijf automatisch een werkruimte aan
 * (OAuth, oude accounts). Idempotent via provision_landing_workspace in Supabase.
 */
export async function provisionWorkspaceIfNeeded(
  supabase: AppSupabase,
): Promise<number | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const existing = await loadActiveCompanyId(supabase, user.id);
  if (existing) return existing;

  const { data, error } = await supabase.rpc("provision_landing_workspace", {});
  if (error) {
    console.error("provision_landing_workspace:", error.message);
    return null;
  }

  return typeof data === "number" ? data : null;
}

/**
 * Resolves the current authenticated user and their active company.
 * Returns the (server) Supabase client so callers can reuse it.
 */
export const getCompanyContext = cache(async function getCompanyContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      companyId: null as number | null,
      impersonating: false as const,
    };
  }

  const impersonation = await getImpersonationContext();
  if (impersonation) {
    return {
      supabase: withReadOnlyGuard(createServiceClient()),
      user,
      companyId: impersonation.targetCompanyId,
      impersonating: true as const,
    };
  }

  let companyId = await loadActiveCompanyId(supabase, user.id);
  if (!companyId) {
    companyId = await provisionWorkspaceIfNeeded(supabase);
  }

  return {
    supabase,
    user,
    companyId,
    impersonating: false as const,
  };
});
