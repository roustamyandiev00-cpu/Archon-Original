"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import {
  extractPreferenceFromChat,
  saveAgentMemory,
} from "@/components/dashboard/agents/memory";

export async function rememberChatInsight(input: {
  text: string;
  agentName?: string;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const preference = extractPreferenceFromChat(input.text);
  if (!preference) return { ok: false };

  await saveAgentMemory(supabase, {
    companyId,
    userId: user.id,
    content: preference,
    memoryType: "preference",
    importance: 8,
    metadata: { agent: input.agentName ?? "Nova", source: "chat" },
  });

  revalidatePath("/dashboard/geheugen");
  return { ok: true };
}
