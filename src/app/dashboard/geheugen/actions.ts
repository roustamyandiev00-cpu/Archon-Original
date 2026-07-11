"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import {
  extractPreferenceFromChat,
  saveAgentMemory,
  type MemoryType,
} from "@/components/dashboard/agents/memory";
import {
  docModeFromMetadata,
  formatMandateDocument,
  KIND_LABELS,
  type AgentDocumentRow,
  type AgentKnowledgeKind,
  type AgentMandateSections,
} from "@/lib/agents/agent-knowledge";

export async function fetchAgentDocuments(agentId: string) {
  const access = await requireWriteAccess();
  if ("error" in access) {
    return { error: access.error, documents: [] as AgentDocumentRow[] };
  }
  const { supabase, companyId } = access;

  const { data, error } = await supabase
    .from("ai_agent_memory")
    .select("id, content, memory_type, metadata, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) return { error: error.message, documents: [] as AgentDocumentRow[] };

  const documents: AgentDocumentRow[] = (data ?? [])
    .filter((row) => {
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      return meta.source === "crew_knowledge_doc" && meta.agentId === agentId;
    })
    .map((row) => {
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const kind = (row.memory_type as AgentKnowledgeKind) ?? "instruction";
      return {
        id: row.id,
        title: String(meta.title ?? row.content.slice(0, 60)),
        kind,
        kindLabel: String(meta.kindLabel ?? KIND_LABELS[kind]),
        docMode: docModeFromMetadata(meta),
        contentPreview: row.content.slice(0, 160),
        createdAt: row.created_at,
      };
    });

  return { documents };
}

export async function saveAgentKnowledgeDoc(input: {
  agentId: string;
  agentName: string;
  kind: AgentKnowledgeKind;
  content?: string;
  title?: string;
  docMode?: "mandate" | "free";
  mandate?: AgentMandateSections;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const docMode = input.docMode ?? "free";
  let content = input.content?.trim() ?? "";

  if (docMode === "mandate" && input.mandate) {
    content = formatMandateDocument(input.agentName, input.mandate);
  }

  if (!content) return { error: "Vul minstens één sectie in." };
  if (content.length < 8) {
    return { error: "Geef iets meer detail (minimaal 8 tekens)." };
  }

  const memoryType = input.kind as MemoryType;
  const importance =
    docMode === "mandate" || input.kind === "instruction"
      ? 10
      : input.kind === "preference"
        ? 8
        : 7;

  const docTitle =
    input.title?.trim() ||
    (docMode === "mandate"
      ? `Mandaat — ${input.agentName}`
      : content.slice(0, 80));

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
      docMode,
      source: "crew_knowledge_doc",
      title: docTitle,
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
