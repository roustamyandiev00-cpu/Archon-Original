import type { SupabaseClient } from "@supabase/supabase-js";

/** Manier waarop een provider gekoppeld wordt. */
export type IntegrationAuth = "oauth" | "apikey" | "peppol" | "connect";

export type ProviderMeta = {
  id: string;
  name: string;
  category: string;
  auth: IntegrationAuth;
  description: string;
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
    description: "Boekhoudsoftware voor kmo's.",
  },
  {
    id: "winbooks",
    name: "WinBooks",
    category: "Boekhouding",
    auth: "apikey",
    description: "Boekhoudpakket — koppel via API-sleutel.",
  },
  {
    id: "silverfin",
    name: "Silverfin",
    category: "Boekhouding",
    auth: "oauth",
    description: "Cloudboekhouding — koppel via OAuth.",
  },
  {
    id: "codabox",
    name: "CodaBox",
    category: "Boekhouding & Peppol",
    auth: "apikey",
    description: "CODA/SODA en e-facturatie.",
  },
  {
    id: "horus",
    name: "Horus",
    category: "Boekhouding",
    auth: "apikey",
    description: "Boekhoudsoftware — koppel via API-sleutel.",
  },
  {
    id: "sage-bob-50",
    name: "Sage BOB 50",
    category: "Boekhouding",
    auth: "apikey",
    description: "Boekhoudpakket — koppel via API-sleutel.",
  },
  {
    id: "clearfacts",
    name: "Clearfacts",
    category: "Boekhouding",
    auth: "apikey",
    description: "Documentverwerking en boekhouding.",
  },
  {
    id: "bouwsoft",
    name: "Bouwsoft",
    category: "Bouwsoftware",
    auth: "apikey",
    description: "Bouwbeheer en werforganisatie.",
  },
  {
    id: "vertuoza",
    name: "Vertuoza",
    category: "Bouwsoftware",
    auth: "apikey",
    description: "Beheer voor bouwbedrijven.",
  },
  {
    id: "isabel-6",
    name: "Isabel 6",
    category: "Banking & Peppol",
    auth: "oauth",
    description: "Multibankieren en e-facturatie.",
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
    description: "Synchroniseer afspraken en herinneringen.",
  },
  {
    id: "microsoft-teams",
    name: "Microsoft Teams",
    category: "Samenwerking",
    auth: "apikey",
    description: "Plan vergaderingen en deel updates.",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    category: "Opslag",
    auth: "apikey",
    description: "Koppel documenten en offertes aan cloudopslag.",
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "Automatisering",
    auth: "apikey",
    description: "Automatiseer terugkerende processen.",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "Boekhouding",
    auth: "apikey",
    description: "Gebruik boekhoudkoppelingen voor export en afstemming.",
  },
];

export function providerMeta(id: string): ProviderMeta | undefined {
  return allSettingsIntegrationProviders().find((p) => p.id === id);
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
