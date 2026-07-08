"use server";

import { revalidatePath } from "next/cache";
import { getCompanyContext } from "@/lib/company";

export async function sendMessage(channelId: string, content: string) {
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) return { error: "Niet ingelogd." };
  if (!content.trim()) return { error: "Bericht is leeg." };

  const { data: membership } = await supabase
    .from("bouwnetwerk_channel_members")
    .select("id")
    .eq("channel_id", channelId)
    .eq("company_id", companyId)
    .eq("is_active", true)
    .maybeSingle();

  if (!membership) {
    return { error: "Je bent geen lid van dit kanaal." };
  }

  const { error } = await supabase.from("bouwnetwerk_messages").insert({
    channel_id: channelId,
    sender_company_id: companyId,
    sender_user_id: user.id,
    content: content.trim(),
    type: "text",
  });

  if (error) return { error: error.message };

  await supabase
    .from("bouwnetwerk_channels")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", channelId);

  revalidatePath("/dashboard/comms");
  return { success: true };
}
