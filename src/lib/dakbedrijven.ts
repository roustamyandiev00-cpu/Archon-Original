export type DakBedrijfCategorie =
  | "winkel"
  | "bouwbedrijf"
  | "dakdekker"
  | "leverancier"
  | "overig";

export const CATEGORIE_META: Record<
  DakBedrijfCategorie,
  { label: string; tone: string; dot: string }
> = {
  winkel: {
    label: "Dakwinkel",
    tone: "bg-sky-500/15 text-sky-300",
    dot: "bg-sky-400",
  },
  bouwbedrijf: {
    label: "Bouwbedrijf",
    tone: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400",
  },
  dakdekker: {
    label: "Dakdekker",
    tone: "bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
  },
  leverancier: {
    label: "Leverancier",
    tone: "bg-violet-500/15 text-violet-300",
    dot: "bg-violet-400",
  },
  overig: {
    label: "Overig",
    tone: "bg-white/5 text-zinc-400",
    dot: "bg-zinc-400",
  },
};

export function categorieMeta(categorie: string | null | undefined) {
  return (
    CATEGORIE_META[(categorie as DakBedrijfCategorie) ?? "bouwbedrijf"] ??
    CATEGORIE_META.bouwbedrijf
  );
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

export type DakBedrijfRow = {
  id: number;
  naam: string;
  categorie: string;
  adres: string | null;
  postcode: string | null;
  stad: string | null;
  regio: string | null;
  telefoon: string | null;
  website: string | null;
  beschrijving: string | null;
  fotos: string[] | null;
  toegevoegd_door: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string | null;
};
