"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import {
  extractPreferenceFromChat,
  saveAgentMemory,
  type MemoryType,
} from "@/components/dashboard/agents/memory";

export type AgentKnowledgeKind =
  | "instruction"
  | "fact"
  | "preference"
  | "context";

const KIND_LABELS: Record<AgentKnowledgeKind, string> = {
  instruction: "Wat moet kunnen",
  fact: "Wat moet leren",
  preference: "Wat onthouden",
  context: "Context & notities",
};

export async function saveAgentKnowledgeDoc(input: {
  agentId: string;
  agentName: string;
  kind: AgentKnowledgeKind;
  content: string;
  title?: string;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const content = input.content.trim();
  if (!content) return { error: "Vul een beschrijving in." };
  if (content.length < 8) {
    return { error: "Geef iets meer detail (minimaal 8 tekens)." };
  }

  const memoryType = input.kind as MemoryType;
  const importance =
    input.kind === "instruction" ? 9 : input.kind === "preference" ? 8 : 7;

  await saveAgentMemory(supabase, {
    companyId,
    userId: user.id,
    content,
    memoryType,
    importance,
    metadata: {
      agent: input.agentName,
      agentId: input.agentId,
      kind: input.kind,
      kindLabel: KIND_LABELS[input.kind],
      source: "crew_knowledge_doc",
      title: input.title?.trim() || content.slice(0, 80),
    },
  });

  revalidatePath("/dashboard/geheugen");
  revalidatePath("/dashboard/command-center");

  return { ok: true };
}

/** Slaat chat-inzichten op wanneer de gebruiker expliciet iets wil onthouden. */
export async function rememberChatInsight(input: {
  text: string;
  agentName: string;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { ok: false as const, error: access.error };

  const content = extractPreferenceFromChat(input.text);
  if (!content) return { ok: false as const };

  const { supabase, companyId, user } = access;

  await saveAgentMemory(supabase, {
    companyId,
    userId: user.id,
    content,
    memoryType: "preference",
    importance: 8,
    metadata: {
      agent: input.agentName,
      source: "chat_insight",
    },
  });

  revalidatePath("/dashboard/geheugen");
  revalidatePath("/dashboard/command-center");

  return { ok: true as const };
}

export { KIND_LABELS };
