import Navbar from "@/components/Navbar";
import AuthPreview from "./AuthPreview";

export type AuthHeroConfig = {
  variant: "rose" | "slate";
  kicker: React.ReactNode;
  title: string;
  accent?: string;
  subtitle: string;
};

const variantStyles = {
  rose: {
    glow: "bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(244,63,94,0.14),transparent_70%)]",
    badge:
      "border-rose-400/30 bg-rose-500/10 text-rose-200",
    accent: "text-gradient-rose",
  },
  slate: {
    glow: "bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(148,163,184,0.12),transparent_70%)]",
    badge:
      "border-slate-400/25 bg-slate-500/10 text-slate-200",
    accent: "text-gradient-slate",
  },
} as const;

export default function AuthLayout({
  children,
  hero,
}: {
  children: React.ReactNode;
  hero: AuthHeroConfig;
}) {
  const v = variantStyles[hero.variant];

  return (
    <>
      <Navbar />
      <main className="relative h-svh overflow-hidden bg-zinc-950">
        <div aria-hidden className={`absolute inset-0 ${v.glow}`} />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-[#060a10]"
        />

        <div className="relative z-10 mx-auto flex h-full max-w-[88rem] flex-col px-4 pb-4 pt-[5.5rem] sm:px-6 sm:pb-5 lg:px-8">
          <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1.45fr)] lg:gap-10 xl:grid-cols-[minmax(0,24rem)_minmax(0,1.55fr)]">
            <section className="flex min-h-0 flex-col">
              <header className="mb-4 shrink-0 sm:mb-5">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wider ${v.badge}`}
                >
                  {hero.kicker}
                </span>
                <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-zinc-50 sm:text-3xl">
                  {hero.title}{" "}
                  {hero.accent && (
                    <span className={v.accent}>{hero.accent}</span>
                  )}
                </h1>
                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                  {hero.subtitle}
                </p>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5 lg:overflow-visible">
                {children}
              </div>
            </section>

            <AuthPreview />
          </div>
        </div>
      </main>
    </>
  );
}
