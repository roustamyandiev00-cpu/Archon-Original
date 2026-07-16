import type { SamenwerkingContractDraft } from "@/lib/agents/contract";

const REQUIRED_HINTS: { key: string; labels: string[] }[] = [
  { key: "omschrijving", labels: ["omschrijving", "werken", "scope"] },
  { key: "locatie", labels: ["locatie", "adres", "werf"] },
  { key: "startdatum", labels: ["start", "aanvang"] },
  { key: "einddatum", labels: ["eind", "oplevering", "duur"] },
  { key: "prijs", labels: ["prijs", "tarief", "vergoeding", "bedrag"] },
  {
    key: "materiaal",
    labels: ["materiaal", "levering materiaal", "materiaalverantwoord"],
  },
  { key: "betaling", labels: ["betaling", "factuur", "betaaltermijn"] },
  { key: "aansprakelijkheid", labels: ["aansprakelijk", "verzekering"] },
  { key: "annulering", labels: ["annul", "opzeg"] },
  { key: "meerwerk", labels: ["meerwerk", "wijziging"] },
  { key: "contact", labels: ["contact", "aanspreekpunt"] },
];

/**
 * Soft completeness-check — waarschuwt, blokkeert niet (§4.8).
 */
export function checkContractCompleteness(draft: SamenwerkingContractDraft): {
  missing: string[];
  ok: boolean;
} {
  const blob = [
    draft.titel ?? "",
    ...(draft.sections ?? []).flatMap((s) => [s.heading ?? "", s.body ?? ""]),
    draft.tarief ? `tarief ${draft.tarief}` : "",
    draft.startdatum ?? "",
    draft.einddatum ?? "",
  ]
    .join("\n")
    .toLowerCase();

  const missing: string[] = [];
  for (const req of REQUIRED_HINTS) {
    const hit = req.labels.some((l) => blob.includes(l));
    if (!hit) missing.push(req.key);
  }

  // Structured fields cover start/eind/prijs when set
  if (draft.startdatum) {
    const i = missing.indexOf("startdatum");
    if (i >= 0) missing.splice(i, 1);
  }
  if (draft.einddatum) {
    const i = missing.indexOf("einddatum");
    if (i >= 0) missing.splice(i, 1);
  }
  if (draft.tarief) {
    const i = missing.indexOf("prijs");
    if (i >= 0) missing.splice(i, 1);
  }

  return { missing, ok: missing.length === 0 };
}
