import OpenAI from "openai";
import type { AiConfig } from "@/app/dashboard/instellingen/settings";
import type { NovaOfferteDraft } from "@/lib/agents/types";
import type { OfferteLijnInput } from "@/lib/offertes";

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
      summary: String(parsed.summary || "Nova-voorstel voor offerte").trim(),
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
}): Promise<{ draft?: NovaOfferteDraft; error?: string }> {
  const description = input.description.trim();
  if (!description) {
    return { error: "Beschrijf eerst de werken." };
  }

  const klant = input.klant?.trim() || "Klant";
  const btw = input.standaardBtw ?? 21;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { draft: fallbackDraft(description, klant, btw) };
  }

  const agentName = input.ai.agentNaam.trim() || "Nova";
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
    const client = new OpenAI({ apiKey });
    const contentArray: any[] = [
      {
        type: "text",
        text: `Klant: ${klant}\n\nWerkbeschrijving:\n${description}`,
      },
    ];

    if (input.images && input.images.length > 0) {
      input.images.forEach((img) => {
        contentArray.push({
          type: "image_url",
          image_url: {
            url: img,
          },
        });
      });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: contentArray as any,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";
    const draft = parseDraft(content, klant, btw);
    if (!draft) {
      return { draft: fallbackDraft(description, klant, btw) };
    }
    return { draft };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI-generatie mislukt.";
    return { error: msg, draft: fallbackDraft(description, klant, btw) };
  }
}
