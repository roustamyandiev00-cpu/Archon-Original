export type ProjectStatus = "gepland" | "actief" | "afgerond" | "gepauzeerd";

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; tone: string; dot: string }
> = {
  gepland: {
    label: "Gepland",
    tone: "bg-sky-500/15 text-sky-300",
    dot: "bg-sky-400",
  },
  actief: {
    label: "Actief",
    tone: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400",
  },
  afgerond: {
    label: "Afgerond",
    tone: "bg-zinc-500/15 text-zinc-300",
    dot: "bg-zinc-400",
  },
  gepauzeerd: {
    label: "Gepauzeerd",
    tone: "bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
  },
};

export function projectStatusMeta(status: string | null | undefined) {
  const key = (status ?? "gepland") as ProjectStatus;
  return PROJECT_STATUS_META[key] ?? PROJECT_STATUS_META.gepland;
}

export type ProjectRow = {
  id: string;
  naam: string;
  klant_naam: string;
  start_datum_label: string;
  status: string;
  created_at: string;
};

export const DEMO_PROJECTEN: ProjectRow[] = [
  {
    id: "demo-1",
    naam: "Renovatie Peeters",
    klant_naam: "Renovatie Peeters",
    start_datum_label: "Mrt 2026",
    status: "actief",
    created_at: "2026-03-01T08:00:00Z",
  },
  {
    id: "demo-2",
    naam: "Dakwerken Wouters",
    klant_naam: "Wouters Dakwerken",
    start_datum_label: "Apr 2026",
    status: "gepland",
    created_at: "2026-04-10T10:00:00Z",
  },
  {
    id: "demo-3",
    naam: "Kantooruitbreiding Yannova",
    klant_naam: "Yannova BV",
    start_datum_label: "Jan 2026",
    status: "afgerond",
    created_at: "2026-01-15T09:00:00Z",
  },
  {
    id: "demo-4",
    naam: "Badkamer De Ridder",
    klant_naam: "Bouwgroep De Ridder",
    start_datum_label: "Mei 2026",
    status: "gepauzeerd",
    created_at: "2026-05-02T14:00:00Z",
  },
];

export function formatProjectDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("nl-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
