import { ARCHON_TEMPLATE_SOURCES } from "./templateSources";

export type ArchonTemplate = {
  id: string;
  label: string;
  description: string;
};

/** De ingebouwde ArchonPro-sjablonen (offerte + factuur in één stijl). */
export const ARCHON_TEMPLATES: ArchonTemplate[] = [
  {
    id: "archon-01",
    label: "Klassiek donker",
    description: "Serif-koppen, petrol accenten. Tijdloos en formeel.",
  },
  {
    id: "archon-02",
    label: "Modern minimaal",
    description: "Strak, veel witruimte en een subtiele kleurgradient.",
  },
  {
    id: "archon-03",
    label: "Bouw bold",
    description: "Krachtige donkere band met accentkleur. Ideaal voor de bouw.",
  },
  {
    id: "archon-04",
    label: "Premium donker",
    description: "Elegante serif-stijl met donkere kopbalk. Premium uitstraling.",
  },
  {
    id: "archon-05",
    label: "Zijbalk donker",
    description: "Donkere zijbalk met contactgegevens naast de documentinhoud.",
  },
];

export function isArchonTemplate(value: string | null | undefined): boolean {
  return typeof value === "string" && value in ARCHON_TEMPLATE_SOURCES;
}

export function archonTemplateMeta(
  value: string | null | undefined,
): ArchonTemplate | null {
  if (!value) return null;
  return ARCHON_TEMPLATES.find((t) => t.id === value) ?? null;
}

/** Voorbeeldwaarden om de {{placeholders}} in te vullen voor een voorbeeld. */
const SAMPLE: Record<string, string> = {
  bedrijf_naam: "Bouwbedrijf Janssen",
  bedrijf_slogan: "Vakwerk sinds 1998",
  bedrijf_adres: "Nijverheidslaan 12",
  bedrijf_postcode_gemeente: "2000 Antwerpen",
  bedrijf_btw: "BE0123.456.789",
  bedrijf_email: "info@janssen.be",
  bedrijf_telefoon: "+32 3 123 45 67",
  bedrijf_website: "www.janssen.be",
  zaakvoerder: "Peter Janssen",
  rpr: "RPR Antwerpen",
  iban: "BE68 5390 0754 7034",
  bic: "GKCCBEBB",

  klant_naam: "Familie De Vos",
  klant_adres: "Molenstraat 45",
  klant_postcode_gemeente: "2600 Berchem",
  klant_email: "devos@voorbeeld.be",
  klant_telefoon: "+32 475 12 34 56",
  klant_btw: "—",
  klant_contactpersoon: "Mevr. De Vos",

  project_omschrijving: "Renovatie badkamer",
  werf_adres: "Molenstraat 45, 2600 Berchem",
  werf_referentie: "WERF-2026-014",
  uitvoeringsperiode: "mei – juni 2026",
  periode: "mei 2026",

  offerte_nummer: "OFF-2026-014",
  offerte_datum: "08-07-2026",
  geldig_tot: "07-08-2026",
  offerte_referentie: "OFF-2026-014",
  offerte_voorwaarden:
    "Prijzen geldig gedurende 30 dagen. Uitvoering na schriftelijk akkoord en ontvangst voorschot.",

  factuur_nummer: "FAC-2026-031",
  factuur_datum: "08-07-2026",
  vervaldatum: "07-08-2026",
  factuur_voorwaarden:
    "Betaalbaar binnen 30 dagen. Bij laattijdige betaling is van rechtswege een verwijlintrest verschuldigd.",
  gestructureerde_mededeling: "+++084/2631/03145+++",
  vorderingsstaat: "1/1",
  btw_verlegd_clausule:
    "Btw verlegd — art. 20 KB nr. 1. Btw te voldoen door de medecontractant.",

  omschrijving: "Plaatsen wandtegels incl. voegwerk",
  aantal: "24",
  eenheid: "m²",
  eenheidsprijs: "€ 45,00",
  regel_totaal: "€ 1.080,00",
  subtotaal: "€ 1.080,00",
  btw_tarief: "6%",
  btw_bedrag: "€ 64,80",
  totaal: "€ 1.144,80",
};

/**
 * Vervangt alle {{placeholders}} in de sjabloon-HTML door voorbeeldwaarden,
 * zodat we een representatief voorbeeld kunnen tonen. Onbekende placeholders
 * worden leeggemaakt.
 */
export function fillTemplatePreview(html: string): string {
  return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    return SAMPLE[key] ?? "";
  });
}

/**
 * Elke sjabloon bevat twee A4-pagina's: pagina 1 = offerte, pagina 2 = factuur.
 * Met `page` kunnen we in het voorbeeld alleen de relevante pagina tonen.
 */
export type PreviewPage = "quote" | "invoice" | "both";

function pageFilterStyle(page: PreviewPage): string {
  if (page === "quote") return "<style>.page:nth-of-type(2){display:none!important;}</style>";
  if (page === "invoice") return "<style>.page:nth-of-type(1){display:none!important;}</style>";
  return "";
}

/** Geeft de ingevulde voorbeeld-HTML voor een ArchonPro-sjabloon-id. */
export function archonTemplatePreviewHtml(
  id: string,
  page: PreviewPage = "both",
): string | null {
  const src = ARCHON_TEMPLATE_SOURCES[id];
  if (!src) return null;
  const filled = fillTemplatePreview(src);
  const style = pageFilterStyle(page);
  if (!style) return filled;
  return filled.includes("</head>")
    ? filled.replace("</head>", `${style}</head>`)
    : `${style}${filled}`;
}
