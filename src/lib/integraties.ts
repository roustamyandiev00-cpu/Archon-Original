import type { SupabaseClient } from "@supabase/supabase-js";

/** Manier waarop een provider gekoppeld wordt. */
export type IntegrationAuth = "oauth" | "apikey" | "peppol" | "connect" | "webhook";

/** live = echte flow; partner = partner-API vereist (geen nep-sync). */
export type IntegrationAvailability = "live" | "partner";

export type ProviderMeta = {
  id: string;
  name: string;
  category: string;
  auth: IntegrationAuth;
  description: string;
  availability?: IntegrationAvailability;
};

/** Eén koppeling tussen een bedrijf en een provider. */
export type Integratie = {
  id: number;
  bedrijf_id: number;
  provider: string;
  status: string;
  config: Record<string, unknown>;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
};

export const INTEGRATION_PROVIDERS: ProviderMeta[] = [
  {
    id: "billit",
    name: "Billit",
    category: "Facturatie & Peppol",
    auth: "apikey",
    description: "Facturatieplatform en Peppol access point.",
  },
  {
    id: "yuki",
    name: "Yuki",
    category: "Boekhouding",
    auth: "apikey",
    description: "Online boekhouding — koppel via API-sleutel.",
  },
  {
    id: "exact-online",
    name: "Exact Online",
    category: "Boekhouding",
    auth: "oauth",
    description: "Boekhoudpakket — koppel via OAuth.",
  },
  {
    id: "teamleader",
    name: "Teamleader",
    category: "CRM & Facturatie",
    auth: "oauth",
    description: "CRM en facturatie — koppel via OAuth.",
  },
  {
    id: "octopus",
    name: "Octopus",
    category: "Boekhouding",
    auth: "apikey",
    availability: "partner",
    description: "Boekhoudsoftware — partner-API vereist (binnenkort).",
  },
  {
    id: "winbooks",
    name: "WinBooks",
    category: "Boekhouding",
    auth: "apikey",
    availability: "partner",
    description: "Boekhoudpakket — partner-API vereist (binnenkort).",
  },
  {
    id: "silverfin",
    name: "Silverfin",
    category: "Boekhouding",
    auth: "oauth",
    availability: "partner",
    description: "Cloudboekhouding — partner-OAuth vereist (binnenkort).",
  },
  {
    id: "codabox",
    name: "CodaBox",
    category: "Boekhouding & Peppol",
    auth: "apikey",
    availability: "partner",
    description: "CODA/SODA — partner-API vereist (binnenkort).",
  },
  {
    id: "horus",
    name: "Horus",
    category: "Boekhouding",
    auth: "apikey",
    availability: "partner",
    description: "Boekhoudsoftware — partner-API vereist (binnenkort).",
  },
  {
    id: "sage-bob-50",
    name: "Sage BOB 50",
    category: "Boekhouding",
    auth: "apikey",
    availability: "partner",
    description: "Boekhoudpakket — koppeling via Sage-partner-API (binnenkort).",
  },
  {
    id: "clearfacts",
    name: "Clearfacts",
    category: "Boekhouding",
    auth: "apikey",
    availability: "partner",
    description: "Documentverwerking — partner-API vereist (binnenkort).",
  },
  {
    id: "bouwsoft",
    name: "Bouwsoft",
    category: "Bouwsoftware",
    auth: "apikey",
    availability: "partner",
    description: "Bouwbeheer — partner-API vereist (binnenkort).",
  },
  {
    id: "vertuoza",
    name: "Vertuoza",
    category: "Bouwsoftware",
    auth: "apikey",
    availability: "partner",
    description: "Beheer voor bouwbedrijven — partner-API vereist (binnenkort).",
  },
  {
    id: "isabel-6",
    name: "Isabel 6",
    category: "Banking & Peppol",
    auth: "oauth",
    availability: "partner",
    description: "Multibankieren — Isabel-partnertoegang vereist (binnenkort).",
  },
  {
    id: "peppol",
    name: "Peppol",
    category: "E-facturatie",
    auth: "peppol",
    description: "Verstuur en ontvang e-facturen via het Peppol-netwerk.",
  },
  {
    id: "slack",
    name: "Slack",
    category: "Meldingen",
    auth: "connect",
    description:
      "Stuur meldingen naar sales- of supportkanalen.",
  },
];

/** Instellingen-tab voor integraties (sidebar-link verwijderd). */
export const INTEGRATIES_SETTINGS_TAB = "integraties" as const;

export function integratiesSettingsHref(
  query?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams({ tab: INTEGRATIES_SETTINGS_TAB });
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
  }
  return `/dashboard/instellingen?${params.toString()}`;
}

export function integratiesSettingsUrl(origin: string) {
  return new URL(integratiesSettingsHref(), origin);
}

/** Alle providers op de instellingenpagina: boekhouding/Peppol + app-koppelingen. */
export function allSettingsIntegrationProviders(): ProviderMeta[] {
  const seen = new Set<string>();
  const merged: ProviderMeta[] = [];
  for (const provider of [...INTEGRATION_PROVIDERS, ...APP_INTEGRATION_PROVIDERS]) {
    if (seen.has(provider.id)) continue;
    seen.add(provider.id);
    merged.push(provider);
  }
  return merged;
}

/** App-koppelingen op de Instellingen-pagina (zoals archonpro-crm). */
export const APP_INTEGRATION_PROVIDERS: ProviderMeta[] = [
  {
    id: "slack",
    name: "Slack",
    category: "Meldingen",
    auth: "connect",
    description: "Stuur meldingen naar sales- of supportkanalen.",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "Planning",
    auth: "oauth",
    description: "Synchroniseer afspraken met je Google-account.",
  },
  {
    id: "microsoft-teams",
    name: "Microsoft Teams",
    category: "Samenwerking",
    auth: "oauth",
    description: "Koppel je Microsoft-account voor Teams-meldingen.",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    category: "Opslag",
    auth: "oauth",
    description: "Koppel je Dropbox-account voor documenten.",
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "Automatisering",
    auth: "webhook",
    description: "Ontvang ArchonPro-events in Zapier via een webhook-URL.",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "Boekhouding",
    auth: "oauth",
    description: "Koppel QuickBooks Online via OAuth.",
  },
];

export function isPartnerOnlyProvider(provider: ProviderMeta): boolean {
  return provider.availability === "partner";
}

export function isPlatformOAuthProvider(id: string): boolean {
  return (
    id === "google-calendar" ||
    id === "microsoft-teams" ||
    id === "dropbox" ||
    id === "quickbooks"
  );
}

export function providerMeta(id: string): ProviderMeta | undefined {
  return allSettingsIntegrationProviders().find((p) => p.id === id);
}

const CLIENT_SAFE_CONFIG_KEYS = new Set([
  "accessPoint",
  "accountEmail",
  "administrationId",
  "authMode",
  "division",
  "legalEntityId",
  "notificationChannel",
  "participantId",
  "partyId",
  "realmId",
  "sandbox",
  "testSentAt",
  "workspaceName",
]);

/** Geeft alleen niet-gevoelige integratiemetadata door aan clientcomponenten. */
export function integrationConfigForClient(
  config: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!config) return {};

  const safe = Object.fromEntries(
    Object.entries(config).filter(([key]) => CLIENT_SAFE_CONFIG_KEYS.has(key)),
  );

  if (typeof config.installationId === "string" && config.installationId) {
    safe.installationId = "configured";
  }

  return safe;
}

/** Access points waarmee je op het Peppol-netwerk kunt aansluiten. */
export const PEPPOL_ACCESS_POINTS: { id: string; label: string }[] = [
  { id: "storecove", label: "Storecove" },
  { id: "ibanity", label: "Ibanity / Isabel" },
  { id: "billit", label: "Billit" },
  { id: "codabox", label: "CodaBox" },
  { id: "other", label: "Andere / handmatig" },
];

/**
 * De `integraties`-tabel is (nog) niet aanwezig in de gegenereerde
 * database-types. Deze helper geeft een losjes getypeerde client zodat we de
 * tabel kunnen bevragen zonder de volledige types-file te herschrijven.
 */
export function untyped(supabase: unknown): SupabaseClient {
  return supabase as SupabaseClient;
}
