import type { CustomAgent } from "@/components/dashboard/agents/config";

export type AiToon = "formeel" | "neutraal" | "informeel";
export type AiToestemming = "voorstellen" | "versturen";

export type AiConfig = {
  agentNaam: string;
  vakgebied: string;
  toon: AiToon;
  toestemming: AiToestemming;
  betalingsherinneringen: boolean;
  instructies: string;
  tokens?: number;
};

/** Instellingen zonder eigen databasekolom, samen bewaard als JSON. */
export type IncassoConfig = {
  deurwaarderEmail: string;
};

export type Extras = {
  ai: AiConfig;
  standaardBtw: number;
  agents?: CustomAgent[];
  incasso?: IncassoConfig;
};

export type SettingsInput = {
  // Bedrijfsgegevens
  naam: string;
  adres: string;
  postcode: string;
  stad: string;
  telefoon: string;
  email: string;
  kvk: string;
  btw: string;
  iban: string;
  peppol_participant_id: string;
  logo_url: string;
  // Offerte- & factuurgegevens
  betaalterm: number;
  standaardBtw: number;
  algemene_voorwaarden: string;
  footer_tekst: string;
  // Sjablonen (waarde = preset-id of "upload:<pad>")
  quoteTemplate: string;
  invoiceTemplate: string;
  // AI-agent
  ai: AiConfig;
  // Incasso
  incasso: IncassoConfig;
};

/** Ingebouwde sjabloonstijlen om uit te kiezen. */
export const TEMPLATE_PRESETS: { id: string; label: string }[] = [
  { id: "modern", label: "Modern (standaard)" },
  { id: "klassiek", label: "Klassiek" },
  { id: "minimaal", label: "Minimaal" },
  { id: "compact", label: "Compact" },
  // ArchonPro-ontwerpsjablonen (met voorbeeld)
  { id: "archon-01", label: "ArchonPro — Klassiek donker" },
  { id: "archon-02", label: "ArchonPro — Modern minimaal" },
  { id: "archon-03", label: "ArchonPro — Bouw bold" },
  { id: "archon-04", label: "ArchonPro — Premium donker" },
  { id: "archon-05", label: "ArchonPro — Zijbalk donker" },
];

export const DEFAULT_TEMPLATE = "modern";

/** Een geüpload eigen sjabloon wordt als "upload:<pad>" opgeslagen. */
export function isUploadedTemplate(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith("upload:");
}

/** Haalt het opslagpad uit een "upload:<pad>"-waarde. */
export function templateStoragePath(value: string | null | undefined): string | null {
  return isUploadedTemplate(value) ? value!.slice("upload:".length) : null;
}

/** Toont een leesbare bestandsnaam voor een geüpload sjabloon. */
export function templateFileName(value: string | null | undefined): string {
  const path = templateStoragePath(value);
  if (!path) return "";
  const base = path.split("/").pop() ?? path;
  // strip de "<soort>-<timestamp>-"-prefix (bv. "quote-1712-eigen.pdf" -> "eigen.pdf")
  return base.replace(/^(quote|invoice)-\d+-/, "");
}

export const defaultAiConfig: AiConfig = {
  agentNaam: "Lima",
  vakgebied: "",
  toon: "neutraal",
  toestemming: "voorstellen",
  betalingsherinneringen: true,
  instructies: "",
  tokens: 15000,
};

export const defaultExtras: Extras = {
  ai: { ...defaultAiConfig },
  standaardBtw: 21,
};

/**
 * De instellingen zonder eigen kolom (AI-config + standaard BTW) worden als
 * JSON opgeslagen in de vrije `ai_assistant`-kolom, zodat we geen
 * databasewijziging nodig hebben. Oudere platte tekst wordt als
 * AI-instructie behandeld.
 */
export const defaultIncassoConfig: IncassoConfig = {
  deurwaarderEmail: "",
};

export function parseExtras(raw: string | null): Extras {
  if (!raw) {
    return {
      ai: { ...defaultAiConfig },
      standaardBtw: 21,
      incasso: { ...defaultIncassoConfig },
    };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Extras> & Partial<AiConfig>;
    if (parsed && typeof parsed === "object") {
      if ("ai" in parsed && parsed.ai) {
        return {
          ai: { ...defaultAiConfig, ...parsed.ai },
          standaardBtw:
            typeof parsed.standaardBtw === "number" ? parsed.standaardBtw : 21,
          agents: Array.isArray(parsed.agents) ? parsed.agents : undefined,
          incasso: {
            ...defaultIncassoConfig,
            ...(parsed.incasso ?? {}),
          },
        };
      }
      if ("toon" in parsed) {
        return {
          ai: { ...defaultAiConfig, ...(parsed as Partial<AiConfig>) },
          standaardBtw: 21,
          incasso: { ...defaultIncassoConfig },
        };
      }
    }
  } catch {
    return {
      ai: { ...defaultAiConfig, instructies: raw },
      standaardBtw: 21,
      incasso: { ...defaultIncassoConfig },
    };
  }
  return {
    ai: { ...defaultAiConfig },
    standaardBtw: 21,
    incasso: { ...defaultIncassoConfig },
  };
}
