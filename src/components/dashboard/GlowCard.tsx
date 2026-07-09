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
  subtle = false,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  /** Minder aura/glow — o.a. voor formulieren zoals instellingen */
  subtle?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      {!subtle && (
        <div aria-hidden className="pointer-events-none absolute -inset-6 -z-10">
          <div className="absolute -left-6 -top-8 h-52 w-52 rounded-full bg-sky-500/35 blur-[70px]" />
          <div className="absolute -right-6 -bottom-8 h-52 w-52 rounded-full bg-orange-500/30 blur-[70px]" />
        </div>
      )}

      <div
        className={
          subtle
            ? `rounded-2xl border border-white/10 bg-zinc-900/50 ${innerClassName}`
            : `rounded-3xl bg-gradient-to-br from-sky-400/70 via-white/25 to-orange-500/70 p-px shadow-[0_0_60px_-15px_rgba(56,189,248,0.45)]`
        }
      >
        {subtle ? (
          children
        ) : (
          <div
            className={`rounded-[calc(1.5rem-1px)] bg-zinc-950/90 backdrop-blur-xl ${innerClassName}`}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
