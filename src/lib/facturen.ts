export type FactuurDocumentType = "factuur" | "proforma" | "credit_nota";

export const DOCUMENT_TYPE_META: Record<
  string,
  {
    label: string;
    heading: string;
    prefix: string;
    // Accentkleuren voor het witte document in de preview
    docAccentText: string;
    docAccentBg: string;
    docBar: string;
    // Badge in de donkere UI
    tone: string;
    dot: string;
  }
> = {
  factuur: {
    label: "Factuur",
    heading: "FACTUUR",
    prefix: "FAC",
    docAccentText: "text-emerald-700",
    docAccentBg: "bg-emerald-50",
    docBar: "bg-emerald-600",
    tone: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400",
  },
  proforma: {
    label: "Proforma",
    heading: "PROFORMA",
    prefix: "PRO",
    docAccentText: "text-amber-700",
    docAccentBg: "bg-amber-50",
    docBar: "bg-amber-500",
    tone: "bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
  },
  credit_nota: {
    label: "Creditnota",
    heading: "CREDITNOTA",
    prefix: "CN",
    docAccentText: "text-rose-700",
    docAccentBg: "bg-rose-50",
    docBar: "bg-rose-600",
    tone: "bg-rose-500/15 text-rose-300",
    dot: "bg-rose-400",
  },
};

export function documentTypeMeta(t: string | null | undefined) {
  return DOCUMENT_TYPE_META[t ?? "factuur"] ?? DOCUMENT_TYPE_META.factuur;
}

export const FACTUUR_STATUS_META: Record<
  string,
  { label: string; tone: string; dot: string }
> = {
  concept: {
    label: "Concept",
    tone: "bg-zinc-500/15 text-zinc-300",
    dot: "bg-zinc-400",
  },
  verzonden: {
    label: "Verzonden",
    tone: "bg-sky-500/15 text-sky-300",
    dot: "bg-sky-400",
  },
  betaald: {
    label: "Betaald",
    tone: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400",
  },
  deels_betaald: {
    label: "Deels betaald",
    tone: "bg-teal-500/15 text-teal-300",
    dot: "bg-teal-400",
  },
  vervallen: {
    label: "Vervallen",
    tone: "bg-rose-500/15 text-rose-300",
    dot: "bg-rose-400",
  },
  herinnerd: {
    label: "Herinnerd",
    tone: "bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
  },
};

export function factuurStatusMeta(status: string | null | undefined) {
  return FACTUUR_STATUS_META[status ?? "concept"] ?? FACTUUR_STATUS_META.concept;
}
