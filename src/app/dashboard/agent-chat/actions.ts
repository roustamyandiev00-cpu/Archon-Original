"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { loadCompanyAgents } from "@/components/dashboard/agents/storage";
import { DEFAULT_AGENTS } from "@/components/dashboard/agents/config";
import {
  generateAgentChatReply,
  type AgentChatTurn,
} from "@/components/dashboard/agents/chat";
import {
  extractPreferenceFromChat,
  saveAgentMemory,
} from "@/components/dashboard/agents/memory";
import { loadMergedAiConfig } from "@/lib/agents/companyAi";

export async function sendAgentChatMessage(input: {
  agentId: string;
  history: AgentChatTurn[];
  message: string;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const agents = await loadCompanyAgents(supabase, companyId);
  const agent =
    agents.find((a) => a.id === input.agentId) ??
    DEFAULT_AGENTS.find((a) => a.id === input.agentId);

  if (!agent) return { error: "Agent niet gevonden." };

  const ai = await loadMergedAiConfig(supabase, companyId, user.id);
  const result = await generateAgentChatReply({
    supabase,
    companyId,
    userId: user.id,
    agent,
    ai,
    history: input.history,
    message: input.message,
  });

  if (result.useFallback) {
    return {
      useFallback: true as const,
      error: result.error,
      fallbackReason: result.fallbackReason,
    };
  }

  if (!result.reply) {
    return { error: result.error ?? "Geen antwoord van de agent." };
  }

  let remembered = false;

  if (result.reply.remember) {
    await saveAgentMemory(supabase, {
      companyId,
      userId: user.id,
      content: result.reply.remember,
      memoryType: "preference",
      importance: 8,
      metadata: { agent: agent.name, source: "llm-chat" },
    });
    remembered = true;
  } else {
    const preference = extractPreferenceFromChat(input.message);
    if (preference) {
      await saveAgentMemory(supabase, {
        companyId,
        userId: user.id,
        content: preference,
        memoryType: "preference",
        importance: 8,
        metadata: { agent: agent.name, source: "chat" },
      });
      remembered = true;
    }
  }

  if (remembered) {
    revalidatePath("/dashboard/geheugen");
  }

  return {
    ok: true as const,
    text: result.reply.text,
    options: result.reply.options,
    navigateTo: result.reply.navigateTo ?? undefined,
    openControlCenter: result.reply.openControlCenter ?? undefined,
    remembered,
  };
}
