import OpenAI from "openai";
import type { AiConfig } from "@/app/dashboard/instellingen/settings";

export type ContractSection = {
  heading: string;
  body: string;
};

export type SamenwerkingContractDraft = {
  titel: string;
  sections: ContractSection[];
  tarief?: string;
  startdatum?: string;
  einddatum?: string;
};

export type ContractContext = {
  partyAName: string;
  partyBName: string;
  werkpostTitel?: string | null;
  werkpostBeschrijving?: string | null;
  werkpostRegio?: string | null;
  werkpostType?: string | null;
  voorgesteldTarief?: number | null;
  reactieBericht?: string | null;
  startdatum?: string | null;
  einddatum?: string | null;
  extraPrompt?: string;
};

function fallbackDraft(ctx: ContractContext): SamenwerkingContractDraft {
  const titel = ctx.werkpostTitel
    ? `Samenwerkingsovereenkomst — ${ctx.werkpostTitel}`
    : `Samenwerkingsovereenkomst — ${ctx.partyAName} & ${ctx.partyBName}`;

  const tarief =
    ctx.voorgesteldTarief != null
      ? `€ ${ctx.voorgesteldTarief.toLocaleString("nl-BE")} / uur`
      : "In onderling overleg";

  return {
    titel,
    tarief,
    startdatum: ctx.startdatum ?? undefined,
    einddatum: ctx.einddatum ?? undefined,
    sections: [
      {
        heading: "Partijen",
        body: `Opdrachtgever: ${ctx.partyAName}\nOnderaannemer / partner: ${ctx.partyBName}`,
      },
      {
        heading: "Opdrachtomschrijving",
        body:
          ctx.werkpostBeschrijving?.trim() ||
          ctx.werkpostTitel ||
          "Werkzaamheden zoals besproken in het Bouwnetwerk-gesprek.",
      },
      {
        heading: "Locatie en planning",
        body: [
          ctx.werkpostRegio ? `Regio: ${ctx.werkpostRegio}` : null,
          ctx.startdatum ? `Start: ${ctx.startdatum}` : null,
          ctx.einddatum ? `Eind: ${ctx.einddatum}` : null,
        ]
          .filter(Boolean)
          .join("\n") || "Planning in onderling overleg.",
      },
      {
        heading: "Vergoeding",
        body: `Voorgesteld tarief: ${tarief}. Betaling binnen 30 dagen na factuur, tenzij anders overeengekomen.`,
      },
      {
        heading: "Aansprakelijkheid",
        body:
          "Beide partijen voeren de werken uit conform de geldende wetgeving en bouwreglementering. Schade door eigen nalatigheid valt onder de verantwoordelijkheid van de veroorzaker.",
      },
      {
        heading: "Beëindiging",
        body:
          "Deze overeenkomst kan door beide partijen schriftelijk worden beëindigd met een opzegtermijn van 7 kalenderdagen, tenzij anders overeengekomen.",
      },
    ],
  };
}

function parseDraft(raw: string): SamenwerkingContractDraft | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SamenwerkingContractDraft>;
    if (!parsed?.titel || !Array.isArray(parsed.sections)) return null;
    const sections = parsed.sections
      .filter(
        (s): s is ContractSection =>
          Boolean(s) &&
          typeof s.heading === "string" &&
          typeof s.body === "string",
      )
      .map((s) => ({
        heading: s.heading.trim(),
        body: s.body.trim(),
      }))
      .filter((s) => s.heading && s.body);
    if (sections.length === 0) return null;
    return {
      titel: String(parsed.titel).trim(),
      sections,
      tarief: parsed.tarief ? String(parsed.tarief).trim() : undefined,
      startdatum: parsed.startdatum ? String(parsed.startdatum).trim() : undefined,
      einddatum: parsed.einddatum ? String(parsed.einddatum).trim() : undefined,
    };
  } catch {
    return null;
  }
}

export async function generateSamenwerkingContractDraft(input: {
  context: ContractContext;
  ai: AiConfig;
}): Promise<{ draft?: SamenwerkingContractDraft; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const ctx = input.context;

  if (!apiKey) {
    return { draft: fallbackDraft(ctx) };
  }

  const agentName = input.ai.agentNaam.trim() || "Nova";
  const system = [
    `Je bent ${agentName}, juridisch-bouwkundige AI-assistent voor Belgische bouwbedrijven.`,
    "Schrijf een onderaanneming / samenwerkingsovereenkomst in helder Nederlands (BE).",
    "Antwoord ALLEEN met geldig JSON (geen markdown).",
    'Schema: {"titel":"string","tarief":"string","startdatum":"string","einddatum":"string","sections":[{"heading":"string","body":"string"}]}',
    "Minimaal secties: Partijen, Opdrachtomschrijving, Locatie en planning, Vergoeding, Aansprakelijkheid, Beëindiging.",
    "Gebruik de meegeleverde context; verzin geen onrealistische bedragen.",
    ctx.extraPrompt ? `Extra instructies: ${ctx.extraPrompt}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const userContent = [
    `Opdrachtgever: ${ctx.partyAName}`,
    `Partner: ${ctx.partyBName}`,
    ctx.werkpostTitel ? `Werkpost: ${ctx.werkpostTitel}` : null,
    ctx.werkpostBeschrijving ? `Beschrijving: ${ctx.werkpostBeschrijving}` : null,
    ctx.werkpostRegio ? `Regio: ${ctx.werkpostRegio}` : null,
    ctx.werkpostType ? `Type: ${ctx.werkpostType}` : null,
    ctx.voorgesteldTarief != null
      ? `Voorgesteld tarief: € ${ctx.voorgesteldTarief}/uur`
      : null,
    ctx.reactieBericht ? `Reactie partner: ${ctx.reactieBericht}` : null,
    ctx.startdatum ? `Startdatum: ${ctx.startdatum}` : null,
    ctx.einddatum ? `Einddatum: ${ctx.einddatum}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const draft = parseDraft(raw) ?? fallbackDraft(ctx);
    return { draft };
  } catch (err) {
    console.error("generateSamenwerkingContractDraft:", err);
    return { draft: fallbackDraft(ctx) };
  }
}
