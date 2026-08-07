import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateOffertePayload } from "@/lib/agents/types";
import { getEmbeddingApiKey } from "@/lib/ai/config";

export type MemoryType =
  | "fact"
  | "preference"
  | "context"
  | "instruction"
  | "interaction";

type MemoryInput = {
  content: string;
  memoryType: MemoryType;
  importance?: number;
  metadata?: Record<string, unknown>;
};

export async function generateEmbedding(text: string): Promise<string | null> {
  const apiKey = getEmbeddingApiKey();
  if (!apiKey) return null;

  try {
    const client = new OpenAI({ apiKey });
    const res = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    });
    return JSON.stringify(res.data[0]?.embedding ?? null);
  } catch {
    return null;
  }
}

export async function saveAgentMemory(
  supabase: SupabaseClient,
  input: {
    companyId: number;
    userId?: string | null;
    content: string;
    memoryType: MemoryType;
    importance?: number;
    metadata?: Record<string, unknown>;
  },
) {
  const content = input.content.trim();
  if (!content) return;

  const embedding = await generateEmbedding(content);
  await supabase.from("ai_agent_memory").insert({
    company_id: input.companyId,
    user_id: input.userId ?? null,
    content,
    memory_type: input.memoryType,
    importance: input.importance ?? 5,
    embedding,
    metadata: input.metadata ?? null,
  });

  if (input.userId) {
    await syncMemoryToKnowledgeBase(supabase, {
      companyId: input.companyId,
      userId: input.userId,
      content,
      memoryType: input.memoryType,
      importance: input.importance,
      metadata: input.metadata,
    });
  }
}

export async function saveAgentMemories(
  supabase: SupabaseClient,
  input: {
    companyId: number;
    userId?: string | null;
    memories: MemoryInput[];
  },
) {
  for (const memory of input.memories) {
    await saveAgentMemory(supabase, {
      companyId: input.companyId,
      userId: input.userId,
      ...memory,
    });
  }
}

function priceFingerprint(omschrijving: string, prijs: number, eenheid: string) {
  return `${omschrijving.trim().toLowerCase()}|${prijs}|${eenheid.trim().toLowerCase()}`;
}

/**
 * Leert typische unitprijzen uit historische offerte-lijnen naar agentgeheugen.
 * Max. `limit` unieke lijnen; skip duplicates via metadata.fingerprint.
 */
export async function seedPricesFromOffertes(
  supabase: SupabaseClient,
  input: {
    companyId: number;
    userId?: string | null;
    limit?: number;
  },
): Promise<{ seeded: number; skipped: number }> {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);

  const { data: lines } = await supabase
    .from("offerte_lijnen")
    .select("omschrijving, prijs_per_eenheid, eenheid, btw_percentage")
    .eq("company_id", input.companyId)
    .gt("prijs_per_eenheid", 0)
    .not("omschrijving", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit * 3);

  if (!lines?.length) return { seeded: 0, skipped: 0 };

  const { data: existing } = await supabase
    .from("ai_agent_memory")
    .select("metadata")
    .eq("company_id", input.companyId)
    .eq("memory_type", "fact")
    .contains("metadata", { source: "offerte_price_seed" })
    .limit(500);

  const known = new Set<string>();
  for (const row of existing ?? []) {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    if (typeof meta.fingerprint === "string") known.add(meta.fingerprint);
  }

  let seeded = 0;
  let skipped = 0;
  const seenBatch = new Set<string>();

  for (const line of lines) {
    if (seeded >= limit) break;
    const omschrijving = (line.omschrijving ?? "").trim();
    const prijs = Number(line.prijs_per_eenheid);
    const eenheid = (line.eenheid ?? "stuks").trim() || "stuks";
    if (!omschrijving || !Number.isFinite(prijs) || prijs <= 0) {
      skipped += 1;
      continue;
    }

    const fingerprint = priceFingerprint(omschrijving, prijs, eenheid);
    if (known.has(fingerprint) || seenBatch.has(fingerprint)) {
      skipped += 1;
      continue;
    }
    seenBatch.add(fingerprint);

    await saveAgentMemory(supabase, {
      companyId: input.companyId,
      userId: input.userId,
      content: `Prijs (historisch): ${omschrijving} — €${prijs}/${eenheid} (BTW ${Number(line.btw_percentage ?? 21)}%)`,
      memoryType: "fact",
      importance: 7,
      metadata: {
        source: "offerte_price_seed",
        fingerprint,
        omschrijving,
        prijs,
        eenheid,
        btw: Number(line.btw_percentage ?? 21),
      },
    });
    seeded += 1;
  }

  return { seeded, skipped };
}

export async function fetchRelevantMemories(
  supabase: SupabaseClient,
  companyId: number,
  query: string,
  limit = 6,
): Promise<string> {
  const embedding = await generateEmbedding(query);
  if (embedding) {
    const { data } = await supabase.rpc("search_agent_memory", {
      p_company_id: companyId,
      p_query_embedding: embedding,
      p_limit: limit,
      p_threshold: 0.45,
    });
    if (data?.length) {
      return data
        .map(
          (m: {
            memory_type: string;
            content: string;
          }) => `- [${m.memory_type}] ${m.content}`,
        )
        .join("\n");
    }
  }

  const { data: recent } = await supabase
    .from("ai_agent_memory")
    .select("content, memory_type")
    .eq("company_id", companyId)
    .order("importance", { ascending: false })
    .limit(limit);

  if (!recent?.length) return "";
  return recent.map((m) => `- [${m.memory_type}] ${m.content}`).join("\n");
}

export async function fetchRelevantKnowledge(
  supabase: SupabaseClient,
  companyId: number,
  query: string,
  limit = 4,
): Promise<string> {
  const embedding = await generateEmbedding(query);
  if (!embedding) return "";

  const { data } = await supabase.rpc("search_knowledge", {
    p_company_id: companyId,
    p_query_embedding: embedding,
    p_limit: limit,
    p_threshold: 0.45,
  });

  if (!data?.length) return "";

  return data
    .map(
      (k: { type: string; title: string; content: string }) =>
        `- [${k.type}] ${k.title}: ${k.content.slice(0, 400)}`,
    )
    .join("\n");
}

/** Combineert agentgeheugen + kennisbank voor RAG-context in prompts. */
export async function fetchRetrievalContext(
  supabase: SupabaseClient,
  companyId: number,
  query: string,
  options?: { memoryLimit?: number; knowledgeLimit?: number },
): Promise<string> {
  const [memories, knowledge, priceMemories] = await Promise.all([
    fetchRelevantMemories(
      supabase,
      companyId,
      query,
      options?.memoryLimit ?? 6,
    ),
    fetchRelevantKnowledge(
      supabase,
      companyId,
      query,
      options?.knowledgeLimit ?? 4,
    ),
    fetchRelevantMemories(
      supabase,
      companyId,
      `prijs uurtarief historisch ${query}`,
      4,
    ),
  ]);

  const parts: string[] = [];
  if (memories) parts.push(`Geheugen:\n${memories}`);
  if (priceMemories && priceMemories !== memories) {
    parts.push(`Geleerde prijzen:\n${priceMemories}`);
  }
  if (knowledge) parts.push(`Kennisbank:\n${knowledge}`);
  return parts.join("\n\n");
}

/** Mandaat- en instructiedocumenten gekoppeld aan één agent. */
export async function fetchAgentMandateContext(
  supabase: SupabaseClient,
  companyId: number,
  agentId: string,
): Promise<string> {
  const { data } = await supabase
    .from("ai_agent_memory")
    .select("content, memory_type, metadata, importance")
    .eq("company_id", companyId)
    .in("memory_type", ["instruction", "preference", "fact"])
    .order("importance", { ascending: false })
    .limit(30);

  const docs = (data ?? []).filter((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return meta.source === "crew_knowledge_doc" && meta.agentId === agentId;
  });

  if (!docs.length) return "";

  return docs
    .map((row) => {
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const title = String(meta.title ?? "Document");
      return `### ${title}\n${row.content}`;
    })
    .join("\n\n");
}

const KNOWLEDGE_SYNC_TYPES = new Set<MemoryType>([
  "fact",
  "preference",
  "instruction",
  "context",
]);

async function syncMemoryToKnowledgeBase(
  supabase: SupabaseClient,
  input: {
    companyId: number;
    userId: string;
    content: string;
    memoryType: MemoryType;
    importance?: number;
    metadata?: Record<string, unknown>;
  },
) {
  if ((input.importance ?? 5) < 6) return;
  if (!KNOWLEDGE_SYNC_TYPES.has(input.memoryType)) return;

  const embedding = await generateEmbedding(input.content);
  const metaTitle =
    typeof input.metadata?.title === "string"
      ? input.metadata.title
      : input.content.slice(0, 80);

  await supabase.from("ai_knowledge_base").insert({
    company_id: input.companyId,
    user_id: input.userId,
    title: metaTitle,
    content: input.content,
    type: input.memoryType,
    source: "agent_memory",
    embedding,
  });
}

export function memoriesFromOffertePayload(
  payload: CreateOffertePayload,
  agentName: string,
): MemoryInput[] {
  const memories: MemoryInput[] = [
    {
      content: `Offerte voor ${payload.klant} opgesteld door ${agentName}.`,
      memoryType: "interaction",
      importance: 5,
      metadata: { klant: payload.klant },
    },
  ];

  if (payload.projectNaam?.trim() || payload.afmetingen?.trim()) {
    memories.push({
      content: [
        `Project ${payload.klant}:`,
        payload.projectNaam?.trim() || null,
        payload.afmetingen?.trim()
          ? `afmetingen ${payload.afmetingen.trim()}`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      memoryType: "fact",
      importance: 7,
      metadata: {
        klant: payload.klant,
        projectNaam: payload.projectNaam ?? null,
        afmetingen: payload.afmetingen ?? null,
      },
    });
  }

  if (payload.notes?.trim()) {
    memories.push({
      content: `Werkbeschrijving ${payload.klant}: ${payload.notes.slice(0, 400)}`,
      memoryType: "context",
      importance: 6,
      metadata: { klant: payload.klant },
    });
  }

  for (const line of payload.lines ?? []) {
    if (!line.omschrijving || !line.prijs_per_eenheid) continue;
    memories.push({
      content: `Prijs ${payload.klant}: ${line.omschrijving} — €${line.prijs_per_eenheid}/${line.eenheid} (BTW ${line.btw_percentage}%)`,
      memoryType: "fact",
      importance: 7,
      metadata: {
        klant: payload.klant,
        eenheid: line.eenheid,
        prijs: line.prijs_per_eenheid,
      },
    });
  }

  return memories;
}

export function memoriesFromExecutedAction(input: {
  actionType: string;
  agentName: string;
  payload: Record<string, unknown>;
  targetRoute?: string | null;
}): MemoryInput[] {
  const { actionType, agentName, payload } = input;
  const memories: MemoryInput[] = [];

  if (actionType === "create_offerte") {
    return memoriesFromOffertePayload(
      payload as unknown as CreateOffertePayload,
      agentName,
    );
  }

  if (actionType === "send_offerte") {
    const offerteId = payload.offerteId as number | undefined;
    memories.push({
      content: `${agentName} heeft offerte #${offerteId ?? "?"} als verzonden gemarkeerd.`,
      memoryType: "interaction",
      importance: 5,
      metadata: { offerteId },
    });
    return memories;
  }

  if (actionType === "create_invoice_from_offerte") {
    const offerteId = payload.offerteId as number | undefined;
    memories.push({
      content: `${agentName} heeft een factuur aangemaakt vanuit offerte #${offerteId ?? "?"}.`,
      memoryType: "interaction",
      importance: 6,
      metadata: { offerteId },
    });
    return memories;
  }

  if (
    actionType === "send_payment_reminder" ||
    actionType === "send_formal_notice"
  ) {
    const factuurId = payload.factuurId as number | undefined;
    const stage = payload.stage as string | undefined;
    memories.push({
      content: `${agentName} heeft ${stage ?? "een incassostap"} uitgevoerd voor factuur #${factuurId ?? "?"}.`,
      memoryType: "interaction",
      importance: 7,
      metadata: { factuurId, stage },
    });
    return memories;
  }

  if (actionType === "forward_to_bailiff") {
    const factuurId = payload.factuurId as number | undefined;
    memories.push({
      content: `${agentName} heeft een incassodossier doorgestuurd naar de deurwaarder voor factuur #${factuurId ?? "?"}.`,
      memoryType: "interaction",
      importance: 8,
      metadata: { factuurId },
    });
    return memories;
  }

  if (actionType === "propose_create_task" || actionType === "propose_invoice_followup_task") {
    const taskId = payload.taskId as number | undefined;
    const title = payload.title as string | undefined;
    const factuurId = payload.factuurId as number | undefined;
    memories.push({
      content: factuurId
        ? `${agentName} heeft opvolgingstaak aangemaakt voor factuur #${factuurId ?? "?"}: ${title ?? "Onbekend"}.`
        : `${agentName} heeft taak aangemaakt: ${title ?? "Onbekend"}.`,
      memoryType: "interaction",
      importance: 5,
      metadata: { taskId, title, factuurId: factuurId ?? null },
    });
    return memories;
  }

  return memories;
}

export async function rememberFromExecution(
  supabase: SupabaseClient,
  input: {
    companyId: number;
    userId: string;
    actionId: number;
  },
) {
  const { data: action } = await supabase
    .from("agent_actions")
    .select("action_type, agent_name, payload_json, target_route")
    .eq("id", input.actionId)
    .eq("company_id", input.companyId)
    .maybeSingle();

  if (!action) return;

  const payload = (action.payload_json ?? {}) as Record<string, unknown>;
  const memories = memoriesFromExecutedAction({
    actionType: action.action_type,
    agentName: action.agent_name || "Lara",
    payload,
    targetRoute: action.target_route,
  });

  if (memories.length === 0) return;

  await saveAgentMemories(supabase, {
    companyId: input.companyId,
    userId: input.userId,
    memories,
  });
}

export function extractPreferenceFromChat(text: string): string | null {
  const q = text.toLowerCase();
  const triggers = [
    "onthoud",
    "onthoud dat",
    "standaard",
    "altijd",
    "nooit",
    "mijn voorkeur",
    "uurtarief",
    "prijs is",
    "we rekenen",
    "we gebruiken",
  ];
  if (!triggers.some((t) => q.includes(t))) return null;
  return text.trim();
}
