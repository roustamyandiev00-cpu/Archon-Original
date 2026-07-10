import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function DashboardPanel({
  title,
  icon: Icon,
  badge,
  action,
  children,
  className = "",
  ...rest
}: {
  title: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={`rounded-2xl border border-white/[0.08] bg-zinc-900/80 ${className}`}
      {...rest}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-500/10 text-orange-400">
              <Icon size={14} />
            </span>
          )}
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
          {badge}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({
  message,
  detail,
  icon: Icon,
  actionLabel,
  actionHref,
}: {
  message: string;
  detail?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {Icon && (
        <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-zinc-800/80 text-zinc-500">
          <Icon size={20} />
        </span>
      )}
      <p className="text-sm text-zinc-400">{message}</p>
      {detail && (
        <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-zinc-600">
          {detail}
        </p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-orange-400"
        >
          {actionLabel}
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

export function QuickActionCard({
  title,
  subtitle,
  href,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-zinc-900/60 px-4 py-3.5 transition-all hover:border-orange-500/25 hover:bg-zinc-900"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-800/80 text-zinc-400 transition-colors group-hover:bg-orange-500/10 group-hover:text-orange-400">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <span className="block text-sm font-semibold text-zinc-100 group-hover:text-orange-100">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-zinc-500">
          {subtitle}
        </span>
      </div>
    </Link>
  );
}

export function MetricStat({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: LucideIcon;
  tone?: "neutral" | "ok" | "warn" | "orange";
}) {
  const iconTone =
    tone === "ok"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : tone === "orange"
          ? "text-orange-400"
          : "text-zinc-500";

  return (
    <div className="flex items-start justify-between gap-2 rounded-xl border border-white/[0.06] bg-zinc-950/40 px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          {label}
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-100">
          {value}
        </p>
        {sublabel && (
          <p className="mt-0.5 truncate text-[11px] text-zinc-500">{sublabel}</p>
        )}
      </div>
      <Icon size={15} className={`mt-0.5 shrink-0 ${iconTone}`} />
    </div>
  );
}

export function PrimaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-orange-400 ${className}`}
    >
      {children}
    </Link>
  );
}

export function IconActionButton({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: ReactNode;
}) {
  const className =
    "grid h-8 w-8 place-items-center rounded-lg bg-orange-500/15 text-orange-400 transition-colors hover:bg-orange-500/25";

  if (href) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className} aria-label={label}>
      {children}
    </button>
  );
}

/** @deprecated use MetricStat for command center layout */
export function StatusChip({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn";
}) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : tone === "warn"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
        : "border-white/10 bg-white/[0.03] text-zinc-300";

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-medium">{value}</p>
    </div>
  );
}
