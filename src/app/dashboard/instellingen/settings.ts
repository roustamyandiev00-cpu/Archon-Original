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

/** Hoe offertes, incasso en documentmails verstuurd worden. */
export type EmailDeliveryMode = "smtp" | "mailto";

export type EmailConfig = {
  /** smtp = via Gmail/SMTP in ArchonPro; mailto = open e-mailprogramma. */
  deliveryMode: EmailDeliveryMode;
};

export type Extras = {
  ai: AiConfig;
  standaardBtw: number;
  agents?: CustomAgent[];
  incasso?: IncassoConfig;
  email?: EmailConfig;
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

/** Vier gecureerde documentstijlen voor offertes en facturen. */
export const TEMPLATE_PRESETS = [
  {
    id: "archon-02",
    label: "Modern",
    description: "Licht, ruim en helder voor een eigentijdse uitstraling.",
  },
  {
    id: "archon-05",
    label: "Zakelijk",
    description: "Gestructureerde zijbalk met alle bedrijfsgegevens in beeld.",
  },
  {
    id: "archon-03",
    label: "Bouwkracht",
    description: "Krachtige lijnen en accenten, gemaakt voor bouwbedrijven.",
  },
  {
    id: "archon-04",
    label: "Premium",
    description: "Elegante donkere kop met een verzorgde, luxere afwerking.",
  },
] as const;

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
  agentNaam: "Ela",
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

export const defaultEmailConfig: EmailConfig = {
  deliveryMode: "mailto",
};

function parseEmailConfig(raw: Partial<EmailConfig> | undefined): EmailConfig {
  const mode = raw?.deliveryMode;
  return {
    deliveryMode: mode === "smtp" || mode === "mailto" ? mode : "mailto",
  };
}

export function parseExtras(raw: string | null): Extras {
  if (!raw) {
    return {
      ai: { ...defaultAiConfig },
      standaardBtw: 21,
      incasso: { ...defaultIncassoConfig },
      email: { ...defaultEmailConfig },
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
          email: parseEmailConfig(parsed.email),
        };
      }
      if ("toon" in parsed) {
        return {
          ai: { ...defaultAiConfig, ...(parsed as Partial<AiConfig>) },
          standaardBtw: 21,
          incasso: { ...defaultIncassoConfig },
          email: { ...defaultEmailConfig },
        };
      }
    }
  } catch {
    return {
      ai: { ...defaultAiConfig, instructies: raw },
      standaardBtw: 21,
      incasso: { ...defaultIncassoConfig },
      email: { ...defaultEmailConfig },
    };
  }
  return {
    ai: { ...defaultAiConfig },
    standaardBtw: 21,
    incasso: { ...defaultIncassoConfig },
    email: { ...defaultEmailConfig },
  };
}
