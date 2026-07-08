export type OfferteStatus =
  | "concept"
  | "verzonden"
  | "bekeken"
  | "geaccepteerd"
  | "afgewezen"
  | "verlopen"
  | "gefactureerd"
  | "geconverteerd_naar_project";

export const STATUS_META: Record<
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
  bekeken: {
    label: "Bekeken",
    tone: "bg-indigo-500/15 text-indigo-300",
    dot: "bg-indigo-400",
  },
  geaccepteerd: {
    label: "Geaccepteerd",
    tone: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400",
  },
  afgewezen: {
    label: "Afgewezen",
    tone: "bg-rose-500/15 text-rose-300",
    dot: "bg-rose-400",
  },
  verlopen: {
    label: "Verlopen",
    tone: "bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
  },
  gefactureerd: {
    label: "Gefactureerd",
    tone: "bg-teal-500/15 text-teal-300",
    dot: "bg-teal-400",
  },
  geconverteerd_naar_project: {
    label: "Project",
    tone: "bg-violet-500/15 text-violet-300",
    dot: "bg-violet-400",
  },
};

export function statusMeta(status: string | null | undefined) {
  return STATUS_META[status ?? "concept"] ?? STATUS_META.concept;
}

/**
 * Een offerte mag bewerkt worden zolang die nog niet definitief bevestigd is.
 * Zodra een offerte geaccepteerd/afgewezen/gefactureerd/geconverteerd of
 * verlopen is, wordt hij vergrendeld.
 */
const EDITABLE_STATUSES = new Set(["concept", "verzonden", "bekeken"]);

export function isOfferteEditable(status: string | null | undefined) {
  return EDITABLE_STATUSES.has(status ?? "concept");
}

export function formatEuro(n: number | null | undefined) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number(n ?? 0));
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export type OfferteLijnInput = {
  omschrijving: string;
  aantal: number;
  eenheid: string;
  prijs_per_eenheid: number;
  btw_percentage: number;
};

export function lineTotals(lines: OfferteLijnInput[]) {
  let subtotaal = 0;
  let btw = 0;
  for (const l of lines) {
    const line = (Number(l.aantal) || 0) * (Number(l.prijs_per_eenheid) || 0);
    subtotaal += line;
    btw += line * ((Number(l.btw_percentage) || 0) / 100);
  }
  return {
    subtotaal,
    btw,
    totaal: subtotaal + btw,
  };
}
