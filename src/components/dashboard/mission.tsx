import type { ReactNode } from "react";

/** Gedeelde presentatie-componenten voor de mission-view pagina's. */

export function PageHeader({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
          {icon}
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

const toneMap = {
  sky: "bg-sky-500/10 text-sky-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  amber: "bg-amber-500/10 text-amber-400",
  violet: "bg-violet-500/10 text-violet-400",
  rose: "bg-rose-500/10 text-rose-400",
  zinc: "bg-white/5 text-zinc-400",
} as const;

export type Tone = keyof typeof toneMap;

export function StatTile({
  label,
  value,
  icon,
  sub,
  tone = "sky",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        {icon && (
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneMap[tone]}`}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-mono text-2xl font-semibold text-zinc-50">{value}</p>
          <p className="truncate text-xs text-zinc-500">{label}</p>
        </div>
      </div>
      {sub && <div className="mt-2 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="grid place-items-center px-6 py-12 text-center">
      <div className="max-w-sm space-y-2">
        {icon && (
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-zinc-500">
            {icon}
          </span>
        )}
        <p className="text-sm font-medium text-zinc-300">{title}</p>
        {description && <p className="text-xs text-zinc-500">{description}</p>}
      </div>
    </div>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Demogegevens
    </span>
  );
}

export function NoCompanyNotice() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
      Je account is nog niet aan een bedrijf gekoppeld. Zodra je een bedrijf hebt,
      verschijnen hier je echte cijfers.
    </div>
  );
}

export function BarList({
  items,
  accent = "from-sky-400 to-indigo-500",
}: {
  items: { label: string; value: number; hint?: string }[];
  accent?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="truncate text-zinc-300">{it.label}</span>
            <span className="flex items-center gap-2 font-mono text-zinc-400">
              {it.hint && <span className="text-[10px] text-zinc-500">{it.hint}</span>}
              {it.value.toLocaleString("nl-BE")}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${accent}`}
              style={{ width: `${Math.max((it.value / max) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProgressBar({
  label,
  current,
  target,
  unit = "",
}: {
  label: string;
  current: number;
  target: number;
  unit?: string;
}) {
  const pct = Math.min((current / target) * 100, 100);
  const color =
    pct >= 100 ? "bg-emerald-400" : pct >= 50 ? "bg-sky-400" : "bg-amber-400";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-mono text-zinc-300">
          {current.toLocaleString("nl-BE")}
          {unit} / {target.toLocaleString("nl-BE")}
          {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
    </div>
  );
}

export function HourBars({
  data,
  nowHour,
}: {
  data: { hour: number; count: number }[];
  nowHour: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div className="flex h-32 items-end gap-[3px]">
        {Array.from({ length: 24 }, (_, hour) => {
          const count = data.find((d) => d.hour === hour)?.count ?? 0;
          const height = count > 0 ? Math.max((count / max) * 100, 8) : 2;
          return (
            <div
              key={hour}
              className="flex flex-1 flex-col items-center justify-end"
              title={`${hour}:00 — ${count} acties`}
            >
              <div
                className={`w-full rounded-t transition-all ${
                  hour === nowHour
                    ? "bg-sky-400"
                    : count > 0
                      ? "bg-sky-400/30"
                      : "bg-white/5"
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between px-1 text-[9px] text-zinc-600">
        <span>00u</span>
        <span>06u</span>
        <span>12u</span>
        <span>18u</span>
        <span>24u</span>
      </div>
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "zinc",
}: {
  children: ReactNode;
  tone?: "ok" | "warn" | "danger" | "info" | "zinc";
}) {
  const map = {
    ok: "bg-emerald-500/15 text-emerald-400",
    warn: "bg-amber-500/15 text-amber-400",
    danger: "bg-rose-500/15 text-rose-400",
    info: "bg-sky-500/15 text-sky-400",
    zinc: "bg-white/8 text-zinc-400",
  } as const;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function relTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "nu";
  if (min < 60) return `${min} min`;
  const u = Math.round(min / 60);
  if (u < 24) return `${u} u`;
  return `${Math.round(u / 24)} d`;
}
