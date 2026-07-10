export type BouwmateriaalCategorie = "dak" | "tegels";

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
};

export function categorieMeta(categorie: string | null | undefined) {
  return (
    CATEGORIE_META[(categorie as BouwmateriaalCategorie) ?? "dak"] ??
    CATEGORIE_META.dak
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
  created_at: string | null;
};
