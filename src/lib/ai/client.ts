import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  getLlmRuntimeConfig,
  type LlmRuntimeConfig,
} from "@/lib/ai/config";

export type ChatCompletionResult = {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  provider: LlmRuntimeConfig["provider"];
};

function createClient(config: LlmRuntimeConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}

export async function runChatCompletion(input: {
  messages: ChatCompletionMessageParam[];
  temperature?: number;
  jsonMode?: boolean;
  model?: string;
  maxTokens?: number;
}): Promise<{ result?: ChatCompletionResult; error?: string }> {
  const config = getLlmRuntimeConfig();
  if (!config) {
    return { error: "Geen AI-provider geconfigureerd (GROQ_API_KEY of OPENAI_API_KEY)." };
  }

  try {
    const client = createClient(config);
    const completion = await client.chat.completions.create({
      model: input.model ?? config.chatModel,
      temperature: input.temperature ?? 0.5,
      max_tokens: input.maxTokens,
      ...(input.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
      messages: input.messages,
    });

    const choice = completion.choices[0]?.message?.content ?? "";
    const usage = completion.usage;

    return {
      result: {
        content: choice,
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        model: completion.model,
        provider: config.provider,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI-aanroep mislukt.";
    return { error: msg };
  }
}
