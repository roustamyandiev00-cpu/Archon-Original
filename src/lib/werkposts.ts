export type WerkpostType = "aanbod" | "vraag";
export type WerkpostStatus = "open" | "in_behandeling" | "gesloten" | "verlopen";
export type WerkpostUrgentie = "normaal" | "urgent" | "zeer_urgent";
export type ReactieStatus = "in_afwachting" | "geaccepteerd" | "afgewezen";
/** Agent-matchflow (§4.6 / §8.4) — naast publicatie-status. */
export type WerkpostPipelineStatus =
  | "gevonden"
  | "interesse_verstuurd"
  | "reactie_ontvangen"
  | "info_nodig"
  | "gesprek_actief"
  | "offerte_aangevraagd"
  | "geaccepteerd"
  | "afgewezen"
  | "verlopen";

export const TYPE_META: Record<
  WerkpostType,
  { label: string; tone: string; dot: string }
> = {
  vraag: {
    label: "Personeel gezocht",
    tone: "bg-sky-500/15 text-sky-300",
    dot: "bg-sky-400",
  },
  aanbod: {
    label: "Personeel beschikbaar",
    tone: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400",
  },
};

export const STATUS_META: Record<
  string,
  { label: string; tone: string; dot: string }
> = {
  open: {
    label: "Open",
    tone: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400",
  },
  in_behandeling: {
    label: "In behandeling",
    tone: "bg-sky-500/15 text-sky-300",
    dot: "bg-sky-400",
  },
  gesloten: {
    label: "Gesloten",
    tone: "bg-zinc-500/15 text-zinc-300",
    dot: "bg-zinc-400",
  },
  verlopen: {
    label: "Verlopen",
    tone: "bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
  },
};

export const URGENTIE_META: Record<
  WerkpostUrgentie,
  { label: string; tone: string }
> = {
  normaal: { label: "Normaal", tone: "bg-white/5 text-zinc-400" },
  urgent: { label: "Urgent", tone: "bg-amber-500/15 text-amber-300" },
  zeer_urgent: { label: "Zeer urgent", tone: "bg-rose-500/15 text-rose-300" },
};

export const REACTIE_STATUS_META: Record<
  string,
  { label: string; tone: string; dot: string }
> = {
  in_afwachting: {
    label: "In afwachting",
    tone: "bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
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
};

export const PIPELINE_STATUS_META: Record<
  WerkpostPipelineStatus,
  { label: string; tone: string; dot: string }
> = {
  gevonden: {
    label: "Gevonden",
    tone: "bg-sky-500/15 text-sky-300",
    dot: "bg-sky-400",
  },
  interesse_verstuurd: {
    label: "Interesse verstuurd",
    tone: "bg-violet-500/15 text-violet-300",
    dot: "bg-violet-400",
  },
  reactie_ontvangen: {
    label: "Reactie ontvangen",
    tone: "bg-cyan-500/15 text-cyan-300",
    dot: "bg-cyan-400",
  },
  info_nodig: {
    label: "Info nodig",
    tone: "bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
  },
  gesprek_actief: {
    label: "Gesprek actief",
    tone: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400",
  },
  offerte_aangevraagd: {
    label: "Offerte aangevraagd",
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
    tone: "bg-zinc-500/15 text-zinc-300",
    dot: "bg-zinc-400",
  },
};

export function typeMeta(type: string | null | undefined) {
  return TYPE_META[(type as WerkpostType) ?? "vraag"] ?? TYPE_META.vraag;
}
export function statusMeta(status: string | null | undefined) {
  return STATUS_META[status ?? "open"] ?? STATUS_META.open;
}
export function urgentieMeta(urgentie: string | null | undefined) {
  return URGENTIE_META[(urgentie as WerkpostUrgentie) ?? "normaal"] ?? URGENTIE_META.normaal;
}
export function reactieStatusMeta(status: string | null | undefined) {
  return (
    REACTIE_STATUS_META[status ?? "in_afwachting"] ??
    REACTIE_STATUS_META.in_afwachting
  );
}

export function pipelineStatusMeta(status: string | null | undefined) {
  if (!status) return null;
  return PIPELINE_STATUS_META[status as WerkpostPipelineStatus] ?? null;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatEuro(value: number | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatTarief(post: {
  budget_min: number | null;
  budget_max: number | null;
  tarief_per_uur: number | null;
  tarief_type: string | null;
}) {
  if (post.tarief_per_uur) {
    return `${formatEuro(post.tarief_per_uur)} / ${post.tarief_type ?? "uur"}`;
  }
  if (post.budget_min && post.budget_max) {
    return `${formatEuro(post.budget_min)} – ${formatEuro(post.budget_max)}`;
  }
  if (post.budget_min || post.budget_max) {
    return formatEuro(post.budget_min ?? post.budget_max);
  }
  return "Budget op aanvraag";
}

export type WerkpostRow = {
  id: string;
  titel: string;
  beschrijving: string;
  aard_van_werk: string;
  type: string;
  status: string;
  pipeline_status?: string | null;
  urgentie: string;
  regio: string;
  stad: string | null;
  postcode: string | null;
  adres: string | null;
  aantal_personen: number;
  startdatum: string;
  einddatum: string | null;
  geschatte_duur_dagen: number | null;
  budget_min: number | null;
  budget_max: number | null;
  tarief_per_uur: number | null;
  tarief_type: string | null;
  vereiste_vaardigheden: string[] | null;
  fotos: string[] | null;
  company_id: number;
  company_naam: string | null;
  created_by_user_id: string | null;
  aantal_reacties: number | null;
  aantal_views: number | null;
  created_at: string | null;
};

export type WerkpostReactieRow = {
  id: string;
  werkpost_id: string;
  company_id: number;
  user_id: string | null;
  bericht: string;
  voorgesteld_tarief: number | null;
  beschikbaarheid_vanaf: string | null;
  beschikbaarheid_tot: string | null;
  status: string | null;
  created_at: string | null;
};

export const REGIOS = [
  "Antwerpen",
  "Vlaams-Brabant",
  "West-Vlaanderen",
  "Oost-Vlaanderen",
  "Limburg",
  "Henegouwen",
  "Luik",
  "Luxemburg",
  "Namen",
  "Waals-Brabant",
  "Brussel",
  // NL-provincies staan er ook in de seed-data bij (bv. Zuid-Holland, Flevoland)
  "Zuid-Holland",
  "Noord-Holland",
  "Flevoland",
  "Utrecht",
];
