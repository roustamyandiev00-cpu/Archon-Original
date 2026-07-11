import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiConfig } from "@/app/dashboard/instellingen/settings";
import type { NovaOfferteDraft } from "@/lib/agents/types";
import type { OfferteLijnInput } from "@/lib/offertes";
import { runChatCompletion } from "@/lib/ai/client";
import { llmIsConfigured } from "@/lib/ai/config";
import {
  assertAiCreditsAvailable,
  deductAiCredits,
} from "@/lib/ai/credits";

const TONE_HINT: Record<AiConfig["toon"], string> = {
  formeel: "Gebruik een formele, professionele toon.",
  neutraal: "Gebruik een neutrale, heldere toon.",
  informeel: "Gebruik een vriendelijke, informele toon.",
};

function fallbackDraft(
  description: string,
  klant: string,
  btw: number,
): NovaOfferteDraft {
  return {
    klant: klant || "Klant",
    notes: description.slice(0, 500),
    summary: "Conceptofferte op basis van je beschrijving (fallback zonder AI).",
    lines: [
      {
        omschrijving: description.slice(0, 200) || "Werken volgens beschrijving",
        aantal: 1,
        eenheid: "forfait",
        prijs_per_eenheid: 0,
        btw_percentage: btw,
      },
    ],
  };
}

function parseDraft(
  raw: string,
  klant: string,
  btw: number,
): NovaOfferteDraft | null {
  try {
    const parsed = JSON.parse(raw) as Partial<NovaOfferteDraft>;
    if (!parsed || !Array.isArray(parsed.lines)) return null;
    const lines: OfferteLijnInput[] = parsed.lines
      .filter((l) => l && typeof l.omschrijving === "string")
      .map((l) => ({
        omschrijving: String(l.omschrijving).trim(),
        aantal: Number(l.aantal) || 1,
        eenheid: String(l.eenheid || "stuks"),
        prijs_per_eenheid: Number(l.prijs_per_eenheid) || 0,
        btw_percentage: Number(l.btw_percentage ?? btw) || btw,
      }))
      .filter((l) => l.omschrijving.length > 0);

    if (lines.length === 0) return null;

    return {
      klant: String(parsed.klant || klant || "Klant").trim(),
      notes: String(parsed.notes || "").trim(),
      summary: String(parsed.summary || "Lima-voorstel voor offerte").trim(),
      lines,
    };
  } catch {
    return null;
  }
}

export async function generateNovaOfferteDraft(input: {
  description: string;
  klant?: string;
  ai: AiConfig;
  standaardBtw?: number;
  images?: string[];
  supabase?: SupabaseClient;
  companyId?: number;
  userId?: string | null;
}): Promise<{ draft?: NovaOfferteDraft; error?: string }> {
  const description = input.description.trim();
  if (!description) {
    return { error: "Beschrijf eerst de werken." };
  }

  const klant = input.klant?.trim() || "Klant";
  const btw = input.standaardBtw ?? 21;

  if (!llmIsConfigured()) {
    return { draft: fallbackDraft(description, klant, btw) };
  }

  if (input.supabase && input.companyId != null) {
    const creditCheck = await assertAiCreditsAvailable(
      input.supabase,
      input.companyId,
      "offerte_draft",
    );
    if (!creditCheck.ok) {
      return { error: creditCheck.error, draft: fallbackDraft(description, klant, btw) };
    }
  }

  const hasImages = Boolean(input.images && input.images.length > 0);
  if (hasImages) {
    return {
      error:
        "Afbeelding-analyse vereist OpenAI Vision. Gebruik tekstbeschrijving of voeg OPENAI_API_KEY toe.",
      draft: fallbackDraft(description, klant, btw),
    };
  }

  const agentName = input.ai.agentNaam.trim() || "Lima";
  const system = [
    `Je bent ${agentName}, AI-assistent voor een Belgisch bouwbedrijf.`,
    input.ai.vakgebied
      ? `Vakgebied: ${input.ai.vakgebied}.`
      : "Focus op bouw- en renovatiewerken in België.",
    TONE_HINT[input.ai.toon],
    input.ai.instructies ? `Extra instructies: ${input.ai.instructies}` : "",
    "Antwoord ALLEEN met geldig JSON (geen markdown).",
    'Schema: {"klant":"string","notes":"string","summary":"korte uitleg","lines":[{"omschrijving":"string","aantal":number,"eenheid":"stuks|m²|u|forfait","prijs_per_eenheid":number,"btw_percentage":number}]}',
    "Gebruik realistische Belgische marktprijzen in euro. Minstens 2 lijnen tenzij het een zeer kleine klus is.",
    input.images && input.images.length > 0 ? "Analyseer ook de meegeleverde afbeeldingen om de materialen, afmetingen of werkomstandigheden nauwkeurig in te schatten." : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { result, error } = await runChatCompletion({
      temperature: 0.4,
      jsonMode: true,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Klant: ${klant}\n\nWerkbeschrijving:\n${description}`,
        },
      ],
    });

    if (error || !result) {
      return { error: error ?? "AI-generatie mislukt.", draft: fallbackDraft(description, klant, btw) };
    }

    const draft = parseDraft(result.content, klant, btw);
    if (!draft) {
      return { draft: fallbackDraft(description, klant, btw) };
    }

    if (input.supabase && input.companyId != null) {
      await deductAiCredits(input.supabase, {
        companyId: input.companyId,
        userId: input.userId,
        action: "offerte_draft",
        metadata: { model: result.model, tokens: result.totalTokens },
      });
    }

    return { draft };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI-generatie mislukt.";
    return { error: msg, draft: fallbackDraft(description, klant, btw) };
  }
}
