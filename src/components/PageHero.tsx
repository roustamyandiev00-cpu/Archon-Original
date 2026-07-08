import { ArrowRight } from "lucide-react";

type Cta = { label: string; href: string };
export type HeroVariant = "aurora" | "spotlight" | "panel" | "mesh";

const variants: Record<
  HeroVariant,
  {
    section: string;
    accent: string;
    badge: string;
    divider: string;
    button: string;
    align: "split" | "center";
  }
> = {
  // ai-metgezel — violet/indigo aurora, split layout
  aurora: {
    section: "bg-gradient-to-br from-indigo-950/60 via-zinc-950 to-fuchsia-950/25",
    accent: "text-gradient",
    badge: "border-indigo-400/25 bg-indigo-500/10 text-indigo-200",
    divider: "from-indigo-400 via-fuchsia-400 to-transparent",
    button: "bg-indigo-500 text-zinc-950 hover:bg-indigo-400",
    align: "split",
  },
  // schatting — sky spotlight, centered layout
  spotlight: {
    section: "bg-gradient-to-b from-sky-950/60 via-zinc-950 to-zinc-950",
    accent: "text-gradient-sky",
    badge: "border-sky-400/30 bg-sky-500/10 text-sky-200",
    divider: "from-sky-400 via-cyan-300 to-transparent",
    button: "bg-sky-500 text-zinc-950 hover:bg-sky-400",
    align: "center",
  },
  // facturen — emerald/sky panel met diagonale lijnen, split layout
  panel: {
    section: "bg-gradient-to-r from-emerald-950/45 via-zinc-950 to-sky-950/35",
    accent: "text-gradient-emerald",
    badge: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    divider: "from-emerald-400 via-sky-400 to-transparent",
    button: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
    align: "split",
  },
  // integraties — cyan/teal mesh blobs, split layout
  mesh: {
    section: "bg-gradient-to-tr from-cyan-950/50 via-zinc-950 to-teal-950/30",
    accent: "text-gradient-cyan",
    badge: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    divider: "from-cyan-400 via-teal-300 to-transparent",
    button: "bg-cyan-500 text-zinc-950 hover:bg-cyan-400",
    align: "split",
  },
};

function Decor({ variant }: { variant: HeroVariant }) {
  if (variant === "aurora") {
    return (
      <>
        <div className="aurora-glow opacity-80" />
        <div className="grid-fade absolute inset-0" />
      </>
    );
  }
  if (variant === "spotlight") {
    return (
      <>
        <div className="hero-spotlight" />
        <div className="grid-fade absolute inset-0 opacity-50" />
      </>
    );
  }
  if (variant === "panel") {
    return (
      <>
        <div className="diag-lines absolute inset-0" />
        <div className="pointer-events-none absolute -left-24 top-0 h-full w-80 bg-gradient-to-r from-emerald-500/15 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute right-0 top-8 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
      </>
    );
  }
  // mesh
  return (
    <>
      <div className="pointer-events-none absolute -left-20 -top-16 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
    </>
  );
}

export default function PageHero({
  variant = "aurora",
  kicker,
  title,
  accent,
  subtitle,
  primary,
  secondary,
  note,
  visual,
}: {
  variant?: HeroVariant;
  kicker: React.ReactNode;
  title: string;
  accent?: string;
  subtitle: string;
  primary: Cta;
  secondary?: Cta;
  note?: string;
  visual?: React.ReactNode;
}) {
  const v = variants[variant];
  const centered = v.align === "center";

  return (
    <section
      className={`relative overflow-hidden border-b border-white/10 pt-32 pb-16 sm:pt-36 sm:pb-20 ${v.section}`}
    >
      <Decor variant={variant} />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div
          className={
            centered
              ? ""
              : `grid items-center gap-12 ${visual ? "lg:grid-cols-2" : ""}`
          }
        >
          <div className={centered ? "mx-auto max-w-3xl text-center" : ""}>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider ${v.badge}`}
            >
              {kicker}
            </span>

            <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              {title} {accent && <span className={v.accent}>{accent}</span>}
            </h1>

            <div
              className={`mt-6 h-px w-24 bg-gradient-to-r ${v.divider} ${
                centered ? "mx-auto" : ""
              }`}
            />

            <p
              className={`mt-6 max-w-xl text-pretty text-lg leading-8 text-zinc-400 ${
                centered ? "mx-auto" : ""
              }`}
            >
              {subtitle}
            </p>

            <div
              className={`mt-8 flex flex-col gap-3 sm:flex-row ${
                centered ? "sm:justify-center" : ""
              }`}
            >
              <a
                href={primary.href}
                className={`group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors ${v.button}`}
              >
                {primary.label}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>
              {secondary && (
                <a
                  href={secondary.href}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
                >
                  {secondary.label}
                </a>
              )}
            </div>

            {note && <p className="mt-6 text-sm text-zinc-500">{note}</p>}
          </div>

          {visual &&
            (centered ? (
              <div className="relative mx-auto mt-14 w-full max-w-2xl">
                {visual}
              </div>
            ) : (
              <div className="relative">{visual}</div>
            ))}
        </div>
      </div>
    </section>
  );
}
