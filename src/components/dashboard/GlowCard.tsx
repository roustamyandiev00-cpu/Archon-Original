import type { ReactNode } from "react";

/**
 * Card met een zachte "aurora" gloed rondom het kader:
 * blauwe glow linksboven -> oranje glow rechtsonder, met een lichte
 * gradient-rand die het kader omlijnt. Past bij het donkere thema.
 */
export default function GlowCard({
  children,
  className = "",
  innerClassName = "",
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Aura-blobs achter het kader */}
      <div aria-hidden className="pointer-events-none absolute -inset-6 -z-10">
        <div className="absolute -left-6 -top-8 h-52 w-52 rounded-full bg-sky-500/35 blur-[70px]" />
        <div className="absolute -right-6 -bottom-8 h-52 w-52 rounded-full bg-orange-500/30 blur-[70px]" />
      </div>

      {/* Gradient-rand (blauw -> licht -> oranje) */}
      <div className="rounded-3xl bg-gradient-to-br from-sky-400/70 via-white/25 to-orange-500/70 p-px shadow-[0_0_60px_-15px_rgba(56,189,248,0.45)]">
        <div
          className={`rounded-[calc(1.5rem-1px)] bg-zinc-950/90 backdrop-blur-xl ${innerClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
