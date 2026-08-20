import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";
import type { AiConfig } from "@/app/dashboard/instellingen/settings";
import type { NovaOfferteDraft } from "@/lib/agents/types";
import type { OfferteLijnInput } from "@/lib/offertes";
import type { PrijslijstPickItem } from "@/components/dashboard/prijslijst/types";
import { runChatCompletion, runVisionChatCompletion } from "@/lib/ai/client";
import { llmIsConfigured, visionIsConfigured } from "@/lib/ai/config";
import {
  assertAiCreditsAvailable,
  deductAiCredits,
} from "@/lib/ai/credits";

const TONE_HINT: Record<AiConfig["toon"], string> = {
  formeel: "Gebruik een formele, professionele toon.",
  neutraal: "Gebruik een neutrale, heldere toon.",
  informeel: "Gebruik een vriendelijke, informele toon.",
};

const MAX_VISION_IMAGES = 4;

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
      summary: String(parsed.summary || "Ela-voorstel voor offerte").trim(),
      lines,
    };
  } catch {
    return null;
  }
}

/** Extraheer m² uit tekst (afmetingen of beschrijving). */
export function parseSquareMeters(text: string): number | null {
  if (!text.trim()) return null;
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*m(?:²|2)(?!\w)/i,
    /(\d+(?:[.,]\d+)?)\s*vierkante\s*meters?\b/i,
    /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*m\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    if (m[2]) {
      const a = Number(String(m[1]).replace(",", "."));
      const b = Number(String(m[2]).replace(",", "."));
      if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) {
        return Math.round(a * b * 100) / 100;
      }
    }
    const n = Number(String(m[1]).replace(",", "."));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSquareUnit(eenheid: string) {
  const e = eenheid.toLowerCase().replace(/\s/g, "");
  return e === "m²" || e === "m2" || e.includes("m²") || e === "m^2";
}

/**
 * Verrijk AI-lijnen met prijslijst: match op omschrijving + zet m²-aantal
 * vanuit afmetingen wanneer de eenheid m² is.
 */
export function enrichLinesWithPrijslijst(
  lines: OfferteLijnInput[],
  prijslijst: PrijslijstPickItem[],
  squareMeters: number | null,
  btw: number,
): OfferteLijnInput[] {
  if (prijslijst.length === 0 && squareMeters == null) return lines;

  return lines.map((line) => {
    const next = { ...line };
    const needle = normalize(line.omschrijving);
    if (needle && prijslijst.length > 0) {
      let best: PrijslijstPickItem | null = null;
      let bestScore = 0;
      for (const item of prijslijst) {
        const hay = normalize(item.omschrijving);
        if (!hay) continue;
        let score = 0;
        if (hay === needle) score = 100;
        else if (hay.includes(needle) || needle.includes(hay)) score = 70;
        else {
          const words = needle.split(" ").filter((w) => w.length > 3);
          const hits = words.filter((w) => hay.includes(w)).length;
          if (hits > 0) score = hits * 15;
        }
        if (score > bestScore) {
          bestScore = score;
          best = item;
        }
      }
      if (best && bestScore >= 30) {
        next.prijs_per_eenheid = best.prijs;
        next.eenheid = best.eenheid || next.eenheid;
        next.btw_percentage = best.btwPercentage || next.btw_percentage || btw;
        if (
          !next.omschrijving.toLowerCase().includes(best.omschrijving.toLowerCase()) &&
          bestScore >= 70
        ) {
          next.omschrijving = best.omschrijving;
        }
      }
    }

    if (squareMeters != null && squareMeters > 0 && isSquareUnit(next.eenheid)) {
      next.aantal = squareMeters;
    }

    return next;
  });
}

/**
 * Als AI geen bruikbare m²-lijn gaf maar wel prijslijst-items met m² bestaan,
 * voeg de best matchende toe op basis van beschrijving.
 */
export function ensurePrijslijstM2Line(
  lines: OfferteLijnInput[],
  prijslijst: PrijslijstPickItem[],
  squareMeters: number | null,
  description: string,
  btw: number,
): OfferteLijnInput[] {
  if (squareMeters == null || squareMeters <= 0 || prijslijst.length === 0) {
    return lines;
  }
  const hasM2 = lines.some((l) => isSquareUnit(l.eenheid) && Number(l.aantal) > 0);
  if (hasM2) return lines;

  const desc = normalize(description);
  const m2Items = prijslijst.filter((p) => isSquareUnit(p.eenheid));
  if (m2Items.length === 0) return lines;

  let best = m2Items[0];
  let bestScore = 0;
  for (const item of m2Items) {
    const hay = normalize(item.omschrijving);
    const words = hay.split(" ").filter((w) => w.length > 3);
    const hits = words.filter((w) => desc.includes(w)).length;
    if (hits > bestScore) {
      bestScore = hits;
      best = item;
    }
  }

  return [
    ...lines,
    {
      omschrijving: best.omschrijving,
      aantal: squareMeters,
      eenheid: best.eenheid || "m²",
      prijs_per_eenheid: best.prijs,
      btw_percentage: best.btwPercentage || btw,
    },
  ];
}

function buildSystemPrompt(
  ai: AiConfig,
  btw: number,
  prijslijst: PrijslijstPickItem[],
  hasImages: boolean,
) {
  const agentName = ai.agentNaam.trim() || "Ela";
  const prijslijstHint =
    prijslijst.length > 0
      ? `Prijslijst van dit bedrijf (gebruik deze prijzen/eenheden waar relevant):\n${prijslijst
          .slice(0, 40)
          .map(
            (p) =>
              `- ${p.omschrijving} | ${p.prijs} €/${p.eenheid} | BTW ${p.btwPercentage}%`,
          )
          .join("\n")}`
      : "Geen prijslijst beschikbaar — gebruik realistische Belgische marktprijzen.";

  return [
    `Je bent ${agentName}, AI-assistent voor een Belgisch bouwbedrijf.`,
    ai.vakgebied
      ? `Vakgebied: ${ai.vakgebied}.`
      : "Focus op bouw- en renovatiewerken in België.",
    TONE_HINT[ai.toon],
    ai.instructies ? `Extra instructies: ${ai.instructies}` : "",
    "Antwoord ALLEEN met geldig JSON (geen markdown).",
    'Schema: {"klant":"string","notes":"string","summary":"korte uitleg","lines":[{"omschrijving":"string","aantal":number,"eenheid":"stuks|m²|u|forfait","prijs_per_eenheid":number,"btw_percentage":number}]}',
    `Standaard BTW: ${btw}%.`,
    "Als afmetingen in m² gegeven zijn en werken per m² geprijsd zijn: zet aantal = m².",
    hasImages
      ? "Analyseer de foto's: materiaal, staat, afwerkingsniveau, zichtbare oppervlakken. Gebruik dat in notes en lijnen."
      : "",
    prijslijstHint,
    "Minstens 2 lijnen tenzij het een zeer kleine klus is.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildUserContent(
  klant: string,
  description: string,
  dimensions: string | undefined,
  images: string[],
): string | ChatCompletionContentPart[] {
  const text = [
    `Klant: ${klant}`,
    dimensions?.trim() ? `Afmetingen (structured): ${dimensions.trim()}` : null,
    `Werkbeschrijving:\n${description}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (images.length === 0) return text;

  return [
    { type: "text", text },
    ...images.slice(0, MAX_VISION_IMAGES).map((url) => ({
      type: "image_url" as const,
      image_url: { url },
    })),
  ];
}

/**
 * Genereert een offerte-draft. Met foto's: vision-model.
 * Daarna verrijking met prijslijst + m²-afmetingen.
 */
export async function generateNovaOfferteDraft(input: {
  description: string;
  klant?: string;
  ai: AiConfig;
  standaardBtw?: number;
  images?: string[];
  dimensions?: string | null;
  prijslijst?: PrijslijstPickItem[];
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
  const images = (input.images ?? []).filter(Boolean);
  const hasImages = images.length > 0;
  const prijslijst = input.prijslijst ?? [];
  const dimensions = input.dimensions?.trim() || "";
  const squareMeters =
    parseSquareMeters(dimensions) ?? parseSquareMeters(description);

  if (!llmIsConfigured() && !(hasImages && visionIsConfigured())) {
    let draft = fallbackDraft(description, klant, btw);
    draft = {
      ...draft,
      lines: ensurePrijslijstM2Line(
        enrichLinesWithPrijslijst(draft.lines, prijslijst, squareMeters, btw),
        prijslijst,
        squareMeters,
        description,
        btw,
      ),
    };
    return { draft };
  }

  const creditAction = hasImages ? "offerte_draft_vision" : "offerte_draft";

  if (input.supabase && input.companyId != null) {
    const creditCheck = await assertAiCreditsAvailable(
      input.supabase,
      input.companyId,
      creditAction,
    );
    if (!creditCheck.ok) {
      let draft = fallbackDraft(description, klant, btw);
      draft = {
        ...draft,
        lines: ensurePrijslijstM2Line(
          enrichLinesWithPrijslijst(draft.lines, prijslijst, squareMeters, btw),
          prijslijst,
          squareMeters,
          description,
          btw,
        ),
      };
      return { error: creditCheck.error, draft };
    }
  }

  const system = buildSystemPrompt(input.ai, btw, prijslijst, hasImages);
  const userContent = buildUserContent(klant, description, dimensions, images);

  try {
    const run =
      hasImages && visionIsConfigured()
        ? runVisionChatCompletion
        : runChatCompletion;

    const { result, error } = await run({
      temperature: 0.35,
      jsonMode: true,
      maxTokens: 2500,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    });

    if (error || !result) {
      let draft = fallbackDraft(description, klant, btw);
      draft = {
        ...draft,
        lines: ensurePrijslijstM2Line(
          enrichLinesWithPrijslijst(draft.lines, prijslijst, squareMeters, btw),
          prijslijst,
          squareMeters,
          description,
          btw,
        ),
      };
      return {
        error:
          error ??
          (hasImages && !visionIsConfigured()
            ? "Foto-analyse vereist OPENAI_API_KEY (of Groq vision). Concept op tekst gemaakt."
            : "AI-generatie mislukt."),
        draft,
      };
    }

    let draft = parseDraft(result.content, klant, btw);
    if (!draft) {
      draft = fallbackDraft(description, klant, btw);
    }

    draft = {
      ...draft,
      lines: ensurePrijslijstM2Line(
        enrichLinesWithPrijslijst(draft.lines, prijslijst, squareMeters, btw),
        prijslijst,
        squareMeters,
        description,
        btw,
      ),
    };

    if (input.supabase && input.companyId != null) {
      await deductAiCredits(input.supabase, {
        companyId: input.companyId,
        userId: input.userId,
        action: creditAction,
        metadata: {
          model: result.model,
          tokens: result.totalTokens,
          vision: hasImages,
          m2: squareMeters,
        },
      });
    }

    return { draft };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI-generatie mislukt.";
    let draft = fallbackDraft(description, klant, btw);
    draft = {
      ...draft,
      lines: ensurePrijslijstM2Line(
        enrichLinesWithPrijslijst(draft.lines, prijslijst, squareMeters, btw),
        prijslijst,
        squareMeters,
        description,
        btw,
      ),
    };
    return { error: msg, draft };
  }
}

/**
 * Agent-entry: suggesties op basis van foto + afmetingen (+ optionele prijslijst).
 * Gebruikt door Nova-wizard en agent `create_offerte`-voorstellen.
 */
export async function suggestOfferteFromPhotosAndDimensions(input: {
  description: string;
  klant?: string;
  dimensions?: string | null;
  images?: string[];
  ai: AiConfig;
  standaardBtw?: number;
  prijslijst?: PrijslijstPickItem[];
  supabase?: SupabaseClient;
  companyId?: number;
  userId?: string | null;
}) {
  return generateNovaOfferteDraft(input);
}
