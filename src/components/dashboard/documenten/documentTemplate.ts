import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TEMPLATE } from "@/app/dashboard/instellingen/settings";
import { ARCHON_TEMPLATE_SOURCES } from "@/components/dashboard/instellingen/templateSources";
import { ARCHON_TEMPLATES } from "@/components/dashboard/instellingen/templatePreview";

export type DocumentKind = "quote" | "invoice";

/** Eén regel op een offerte/factuur, reeds als tekst geformatteerd. */
export type DocumentRow = {
  omschrijving: string;
  aantal: string;
  eenheid: string;
  eenheidsprijs: string;
  regel_totaal: string;
};

/** De sjablonen die daadwerkelijk gerenderd kunnen worden. */
export const RENDERABLE_TEMPLATES = ARCHON_TEMPLATES;
const FALLBACK_TEMPLATE_ID = "archon-02";

/** Bepaalt welk sjabloon-id we renderen (met terugval op een standaard). */
export function resolveTemplateId(value: string | null | undefined): string {
  if (value && value in ARCHON_TEMPLATE_SOURCES) return value;
  return FALLBACK_TEMPLATE_ID;
}

/** Haalt het standaardsjabloon uit Instellingen op voor dit documenttype. */
export async function loadCompanyDefaultTemplate(
  supabase: SupabaseClient,
  companyId: number,
  kind: DocumentKind,
): Promise<string> {
  const { data } = await supabase
    .from("bedrijven")
    .select("default_quote_template, default_invoice_template")
    .eq("id", companyId)
    .maybeSingle();

  const value =
    kind === "quote"
      ? data?.default_quote_template
      : data?.default_invoice_template;

  return (value && String(value).trim()) || DEFAULT_TEMPLATE;
}

/** Ruwe waarde voor opslag: document → bedrijfsstandaard → fallback. */
export function pickStoredTemplateId(
  documentTemplateId: string | null | undefined,
  companyDefault?: string | null | undefined,
): string {
  return (
    (documentTemplateId && documentTemplateId.trim()) ||
    (companyDefault && companyDefault.trim()) ||
    DEFAULT_TEMPLATE
  );
}

/** Bepaalt welk Archon-sjabloon gerenderd wordt (document → Instellingen → fallback). */
export function resolveDocumentTemplateId(
  documentTemplateId: string | null | undefined,
  companyDefault?: string | null | undefined,
): string {
  return resolveTemplateId(
    pickStoredTemplateId(documentTemplateId, companyDefault),
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Verwijdert de placeholder-styling zodat echte data in de normale inktkleur komt. */
function stripPlaceholderClass(row: string): string {
  return row.replace(/\bph\b/g, "");
}

/**
 * De items-tabel bevat één placeholder-regel plus enkele lege opvulrijen. Deze
 * functie vervangt dat blok (in beide pagina's) door de echte regels.
 */
function expandRows(html: string, rows: DocumentRow[]): string {
  const single = html.match(
    /<tr>\s*<td[^>]*>\s*\{\{omschrijving\}\}[\s\S]*?<\/tr>/,
  );
  if (!single) return html;

  const rowTemplate = single[0];
  const built = rows
    .map((r) => {
      const filled = rowTemplate
        .replace(/\{\{omschrijving\}\}/g, escapeHtml(r.omschrijving))
        .replace(/\{\{aantal\}\}/g, escapeHtml(r.aantal))
        .replace(/\{\{eenheid\}\}/g, escapeHtml(r.eenheid))
        .replace(/\{\{eenheidsprijs\}\}/g, escapeHtml(r.eenheidsprijs))
        .replace(/\{\{regel_totaal\}\}/g, escapeHtml(r.regel_totaal));
      return stripPlaceholderClass(filled);
    })
    .join("");

  // Placeholder-regel + eventuele lege opvulrijen die er direct op volgen.
  const blockRe =
    /<tr>\s*<td[^>]*>\s*\{\{omschrijving\}\}[\s\S]*?<\/tr>(?:\s*<tr>(?:\s*<td><\/td>)+\s*<\/tr>)*/g;
  return html.replace(blockRe, () => built);
}

function pageFilterStyle(kind: DocumentKind): string {
  // Pagina 1 = offerte, pagina 2 = factuur.
  return kind === "quote"
    ? "<style>.page:nth-of-type(2){display:none!important;}</style>"
    : "<style>.page:nth-of-type(1){display:none!important;}</style>";
}

const AUTOPRINT_SCRIPT =
  "<script>window.addEventListener('load',function(){setTimeout(function(){window.focus();window.print();},350);});</script>";

/**
 * Bouwt de volledige, printklare HTML voor één offerte of factuur op basis van
 * het gekozen sjabloon en de echte gegevens.
 */
export function buildDocumentHtml(
  templateId: string,
  kind: DocumentKind,
  values: Record<string, string>,
  rows: DocumentRow[],
  options: { autoPrint?: boolean } = {},
): string {
  const src =
    ARCHON_TEMPLATE_SOURCES[resolveTemplateId(templateId)] ??
    ARCHON_TEMPLATE_SOURCES[FALLBACK_TEMPLATE_ID];

  let html = expandRows(src, rows);
  html = html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) =>
    escapeHtml(values[key] ?? ""),
  );

  const head = pageFilterStyle(kind) + (options.autoPrint ? AUTOPRINT_SCRIPT : "");
  return html.includes("</head>")
    ? html.replace("</head>", `${head}</head>`)
    : `${head}${html}`;
}
