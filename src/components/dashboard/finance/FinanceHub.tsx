import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export function FinancePageHeader({
  eyebrow,
  title,
  description,
  icon,
  badge,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
          {icon}
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-400/90">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-50 sm:text-2xl">
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
            {description}
          </p>
        </div>
      </div>
      {badge}
    </header>
  );
}

export function FinanceMetric({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "ok" | "warn" | "orange";
}) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-500/20 bg-emerald-500/[0.04]"
      : tone === "warn"
        ? "border-amber-500/20 bg-amber-500/[0.04]"
        : tone === "orange"
          ? "border-orange-500/20 bg-orange-500/[0.04]"
          : "border-white/[0.08] bg-zinc-900/60";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-50">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export function FinancePanel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/60">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function FinanceActionCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-5 transition-colors hover:border-orange-500/25 hover:bg-zinc-950/70"
    >
      <p className="text-sm font-semibold text-zinc-100 group-hover:text-orange-100">
        {title}
      </p>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-500">
        {description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-orange-400">
        {cta}
        <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "warn" | "neutral" | "danger";
}) {
  const cls =
    tone === "ok"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      : tone === "warn"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
        : tone === "danger"
          ? "border-rose-500/25 bg-rose-500/10 text-rose-300"
          : "border-white/10 bg-white/[0.04] text-zinc-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cls}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          tone === "ok"
            ? "bg-emerald-400"
            : tone === "warn"
              ? "bg-amber-400"
              : tone === "danger"
                ? "bg-rose-400"
                : "bg-zinc-500"
        }`}
      />
      {label}
    </span>
  );
}
