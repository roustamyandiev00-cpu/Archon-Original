"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export type ContentRapportageTargetType =
  | "chat_bericht"
  | "werkpost"
  | "review";

export type ContentRapportageStatus = "open" | "behandeld" | "afgewezen";

export async function createContentRapportage(input: {
  targetType: ContentRapportageTargetType;
  targetId: string;
  reden: string;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const reden = input.reden.trim();
  if (reden.length < 5) {
    return { error: "Geef een korte toelichting (min. 5 tekens)." };
  }
  const targetId = String(input.targetId ?? "").trim();
  if (!targetId) return { error: "Geen doel geselecteerd." };

  const { error } = await supabase.from("content_rapportages").insert({
    reporter_user_id: user.id,
    reporter_company_id: companyId,
    target_type: input.targetType,
    target_id: targetId,
    reden,
    status: "open",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/rapportages");
  return { ok: true as const };
}

export async function resolveContentRapportage(input: {
  id: string;
  status: "behandeld" | "afgewezen";
}) {
  const { serviceSupabase, user } = await requirePlatformAdmin();

  const { error } = await serviceSupabase
    .from("content_rapportages")
    .update({
      status: input.status,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", input.id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/rapportages");
  return { ok: true as const };
}
