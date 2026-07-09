/**
 * Gedeelde definitie van de publieke API-resources. Wordt zowel door de
 * route-handler (validatie) als door de instellingen-UI (documentatie) gebruikt.
 */
export type ApiResource = {
  id: string;
  path: string;
  title: string;
  description: string;
};

export const API_RESOURCES: ApiResource[] = [
  {
    id: "me",
    path: "/api/v1/me",
    title: "Bedrijf",
    description: "De gegevens van je eigen bedrijf (naam, adres, btw, IBAN …).",
  },
  {
    id: "offertes",
    path: "/api/v1/offertes",
    title: "Offertes",
    description: "Al je offertes met nummer, klant, bedrag, status en datum.",
  },
  {
    id: "facturen",
    path: "/api/v1/facturen",
    title: "Facturen",
    description:
      "Facturen met bedragen, btw, status, vervaldatum en betaalmoment.",
  },
  {
    id: "klanten",
    path: "/api/v1/klanten",
    title: "Klanten",
    description: "Je volledige klantenbestand uit het CRM.",
  },
  {
    id: "werkposts",
    path: "/api/v1/werkposts",
    title: "Werkposts",
    description: "Je geplaatste bouwnetwerk-posts (vraag & aanbod).",
  },
];

export const API_RESOURCE_IDS = API_RESOURCES.map((r) => r.id);

/** Filtert een lijst naar geldige resource-ids (voor scopes). */
export function sanitizeScopes(scopes: string[]): string[] {
  const unique = Array.from(new Set(scopes)).filter((s) =>
    API_RESOURCE_IDS.includes(s),
  );
  return unique.length > 0 ? unique : [...API_RESOURCE_IDS];
}

/** Publieke (niet-geheime) weergave van een API-sleutel voor de UI. */
export type ApiKeyInfo = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
};
