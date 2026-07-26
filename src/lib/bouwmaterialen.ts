export type BouwmateriaalCategorie =
  | "dak"
  | "tegels"
  | "hout"
  | "isolatie"
  | "sanitair"
  | "elektro"
  | "verf"
  | "gereedschap"
  | "algemeen";

export const CATEGORIE_META: Record<
  BouwmateriaalCategorie,
  { label: string; tone: string; dot: string }
> = {
  dak: {
    label: "Dakmaterialen",
    tone: "bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
  },
  tegels: {
    label: "Tegels",
    tone: "bg-sky-500/15 text-sky-300",
    dot: "bg-sky-400",
  },
  hout: {
    label: "Hout & plaatmateriaal",
    tone: "bg-orange-500/15 text-orange-300",
    dot: "bg-orange-400",
  },
  isolatie: {
    label: "Isolatie",
    tone: "bg-lime-500/15 text-lime-300",
    dot: "bg-lime-400",
  },
  sanitair: {
    label: "Sanitair & verwarming",
    tone: "bg-cyan-500/15 text-cyan-300",
    dot: "bg-cyan-400",
  },
  elektro: {
    label: "Elektriciteit",
    tone: "bg-yellow-500/15 text-yellow-300",
    dot: "bg-yellow-400",
  },
  verf: {
    label: "Verf & afwerking",
    tone: "bg-violet-500/15 text-violet-300",
    dot: "bg-violet-400",
  },
  gereedschap: {
    label: "Gereedschap & machines",
    tone: "bg-rose-500/15 text-rose-300",
    dot: "bg-rose-400",
  },
  algemeen: {
    label: "Algemene bouwmaterialen",
    tone: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400",
  },
};

export const BOUWMATERIAAL_CATEGORIEEN = Object.keys(
  CATEGORIE_META,
) as BouwmateriaalCategorie[];

export function categorieMeta(categorie: string | null | undefined) {
  return (
    CATEGORIE_META[(categorie as BouwmateriaalCategorie) ?? "algemeen"] ??
    CATEGORIE_META.algemeen
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

export type BouwmateriaalWinkelRow = {
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
  verificatiestatus?: string | null;
  created_at: string | null;
};
