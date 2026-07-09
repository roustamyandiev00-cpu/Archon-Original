export const STADIA = [
  "Lead",
  "Gekwalificeerd",
  "Voorstel",
  "Onderhandeling",
  "Gewonnen",
  "Verloren",
] as const;

export type Stadium = (typeof STADIA)[number];

type StageStyle = {
  /** dot + accent color classes */
  dot: string;
  ring: string;
  text: string;
};

export const STAGE_STYLES: Record<Stadium, StageStyle> = {
  Lead: { dot: "bg-sky-400", ring: "ring-sky-500/40", text: "text-sky-300" },
  Gekwalificeerd: {
    dot: "bg-cyan-400",
    ring: "ring-cyan-500/40",
    text: "text-cyan-300",
  },
  Voorstel: {
    dot: "bg-indigo-400",
    ring: "ring-indigo-500/40",
    text: "text-indigo-300",
  },
  Onderhandeling: {
    dot: "bg-amber-400",
    ring: "ring-amber-500/40",
    text: "text-amber-300",
  },
  Gewonnen: {
    dot: "bg-emerald-400",
    ring: "ring-emerald-500/40",
    text: "text-emerald-300",
  },
  Verloren: {
    dot: "bg-rose-400",
    ring: "ring-rose-500/40",
    text: "text-rose-300",
  },
};
