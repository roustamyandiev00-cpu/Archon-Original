"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { assertChatTermsAccepted } from "@/app/dashboard/comms/chat-terms-actions";
import {
  evaluateContactSharing,
  proposeChatModerationIfNeeded,
} from "@/lib/bouwnetwerk/chat-guards";

const COMMS_MEDIA_BUCKET = "werkpost-media";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ATTACHMENTS = 5;

export type CommsAttachment = {
  url: string;
  name: string;
  mime: string;
  size: number;
  isImage: boolean;
};

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w.\- ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50) || "bestand";

export async function sendMessage(channelId: string, content: string) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

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

  const terms = await assertChatTermsAccepted(supabase, companyId, user.id);
  if ("error" in terms) return { error: terms.error };

  const trimmed = content.trim();
  const contact = await evaluateContactSharing({
    supabase,
    channelId,
    content: trimmed,
    blockWithoutContract: false,
  });
  if (contact.blocked) return { error: contact.blocked };

  const { data: inserted, error } = await supabase
    .from("bouwnetwerk_messages")
    .insert({
      channel_id: channelId,
      sender_company_id: companyId,
      sender_user_id: user.id,
      content: trimmed,
      type: "text",
    })
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };

  await supabase
    .from("bouwnetwerk_channels")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", channelId);

  // Fire-and-forget moderatie-voorstel (mens bevestigt)
  void proposeChatModerationIfNeeded({
    supabase,
    companyId,
    channelId,
    messageId: inserted?.id ?? null,
    content: trimmed,
    contactHits: contact.hits,
  });

  revalidatePath("/dashboard/comms");
  revalidatePath("/dashboard/werkposts/samenwerkingen");
  return {
    success: true as const,
    warning: contact.warning,
  };
}

/**
 * Uploadt bijlagen (foto's/documenten) naar de bucket `werkpost-media`
 * (map <company_id>/comms/<channel_id>/...) en stuurt een chatbericht met
 * de bijlagen in de bestaande `attachments`-kolom.
 */
export async function sendAttachments(channelId: string, formData: FormData) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;
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

  const terms = await assertChatTermsAccepted(supabase, companyId, user.id);
  if ("error" in terms) return { error: terms.error };

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) return { error: "Geen bestand gekozen." };
  if (files.length > MAX_ATTACHMENTS) {
    return { error: `Maximaal ${MAX_ATTACHMENTS} bijlagen per bericht.` };
  }

  const attachments: CommsAttachment[] = [];
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { error: `"${file.name}" is te groot (max. 10 MB).` };
    }
    const path = `${companyId}/comms/${channelId}/${Date.now()}-${slugify(
      file.name,
    )}`;
    const { error: uploadError } = await supabase.storage
      .from(COMMS_MEDIA_BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
    if (uploadError) {
      return { error: `Uploaden mislukt: ${uploadError.message}` };
    }
    const { data: pub } = supabase.storage
      .from(COMMS_MEDIA_BUCKET)
      .getPublicUrl(path);
    attachments.push({
      url: pub.publicUrl,
      name: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      isImage: (file.type || "").startsWith("image/"),
    });
  }

  const caption = String(formData.get("content") || "").trim();
  const contact = await evaluateContactSharing({
    supabase,
    channelId,
    content: caption,
    blockWithoutContract: false,
  });

  const { data: inserted, error } = await supabase
    .from("bouwnetwerk_messages")
    .insert({
      channel_id: channelId,
      sender_company_id: companyId,
      sender_user_id: user.id,
      content: caption || null,
      type: "file",
      attachments,
    })
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };

  await supabase
    .from("bouwnetwerk_channels")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", channelId);

  if (caption) {
    void proposeChatModerationIfNeeded({
      supabase,
      companyId,
      channelId,
      messageId: inserted?.id ?? null,
      content: caption,
      contactHits: contact.hits,
    });
  }

  revalidatePath("/dashboard/comms");
  revalidatePath("/dashboard/werkposts/samenwerkingen");
  return {
    success: true as const,
    warning: contact.warning,
  };
}
