/** Groq OpenAI-compatible endpoint (gsk_… keys). */
export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export const DEFAULT_GROQ_CHAT_MODEL =
  process.env.GROQ_CHAT_MODEL?.trim() || "llama-3.3-70b-versatile";

export const DEFAULT_GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL?.trim() ||
  "meta-llama/llama-4-scout-17b-16e-instruct";

export const DEFAULT_OPENAI_CHAT_MODEL = "gpt-4o-mini";
export const DEFAULT_OPENAI_VISION_MODEL =
  process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";
export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

export type LlmProvider = "groq" | "openai";

export type LlmRuntimeConfig = {
  provider: LlmProvider;
  apiKey: string;
  chatModel: string;
  baseURL?: string;
};

export function getLlmRuntimeConfig(): LlmRuntimeConfig | null {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    return {
      provider: "groq",
      apiKey: groqKey,
      chatModel: DEFAULT_GROQ_CHAT_MODEL,
      baseURL: GROQ_BASE_URL,
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      chatModel: DEFAULT_OPENAI_CHAT_MODEL,
    };
  }

  return null;
}

/**
 * Vision-capabele runtime. OpenAI heeft voorkeur (stabieler voor foto's);
 * anders Groq vision-model.
 */
export function getVisionRuntimeConfig(): LlmRuntimeConfig | null {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      chatModel: DEFAULT_OPENAI_VISION_MODEL,
    };
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    return {
      provider: "groq",
      apiKey: groqKey,
      chatModel: DEFAULT_GROQ_VISION_MODEL,
      baseURL: GROQ_BASE_URL,
    };
  }

  return null;
}

export function llmIsConfigured(): boolean {
  return getLlmRuntimeConfig() !== null;
}

export function visionIsConfigured(): boolean {
  return getVisionRuntimeConfig() !== null;
}

export function getEmbeddingApiKey(): string | null {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

/** Gratis starter-tegoed per bedrijf (tot betaling live is). */
export function starterAiCredits(): number {
  const raw = process.env.AI_STARTER_CREDITS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
}

/** Vaste kosten per actie (later verfijnen op token-gebruik). */
export const AI_CREDIT_COSTS = {
  chat: 40,
  offerte_draft: 120,
  offerte_draft_vision: 220,
  contract_draft: 150,
  embedding: 5,
} as const;

export type AiCreditAction = keyof typeof AI_CREDIT_COSTS;
