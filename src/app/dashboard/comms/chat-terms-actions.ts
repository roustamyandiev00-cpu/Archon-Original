"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import {
  CHAT_TERMS_VERSION,
  hasAcceptedCurrentChatTerms,
} from "@/lib/bouwnetwerk/chat-terms";

export async function acceptChatTerms() {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const { error } = await supabase
    .from("company_memberships")
    .update({
      chat_terms_accepted_at: new Date().toISOString(),
      chat_terms_version: CHAT_TERMS_VERSION,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/werkposts/samenwerkingen");
  revalidatePath("/dashboard/comms");
  return { ok: true as const };
}

export async function assertChatTermsAccepted(
  supabase: SupabaseClient,
  companyId: number,
  userId: string,
): Promise<{ ok: true } | { error: string }> {
  const { data } = await supabase
    .from("company_memberships")
    .select("chat_terms_accepted_at, chat_terms_version")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (
    !hasAcceptedCurrentChatTerms({
      acceptedAt: data?.chat_terms_accepted_at,
      version: data?.chat_terms_version,
    })
  ) {
    return {
      error:
        "Accepteer eerst de chatregels en toestemming voor opslag om te chatten.",
    };
  }
  return { ok: true };
}
