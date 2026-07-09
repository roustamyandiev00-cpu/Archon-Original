"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Contact,
  Euro,
  FileText,
  Receipt,
} from "lucide-react";

const statIcons = {
  fileText: FileText,
  euro: Euro,
  contact: Contact,
  receipt: Receipt,
} as const;

export type StatIcon = keyof typeof statIcons;

export function Panel({
  title,
  action,
  className = "",
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {title}
          </h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  trend,
  icon,
  data,
  positive = true,
  href,
  size = "default",
}: {
  label: string;
  value: string;
  trend: string;
  icon: StatIcon;
  data: { v: number }[];
  positive?: boolean;
  href?: string;
  size?: "default" | "lg" | "compact";
}) {
  const Icon = statIcons[icon];
  const stroke = positive ? "#38bdf8" : "#e85a6b";
  const gid = `spark-${label.replace(/\s+/g, "")}`;
  const large = size === "lg";
  const compact = size === "compact";
  const card = (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-zinc-900/40 backdrop-blur transition-colors ${
        compact
          ? "border-white/5 p-3 hover:border-white/10"
          : `border-white/10 hover:-translate-y-0.5 hover:border-sky-500/40 hover:shadow-[0_8px_30px_-12px_rgba(56,189,248,0.35)] ${
              large ? "rounded-2xl p-5 sm:p-6" : "rounded-2xl p-4"
            }`
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`uppercase tracking-wide text-zinc-500 ${
              compact
                ? "text-[10px] leading-tight"
                : large
                  ? "text-xs"
                  : "text-[11px]"
            }`}
          >
            {label}
          </p>
          <p
            className={`font-mono font-semibold text-zinc-100 ${
              compact
                ? "mt-1 text-lg"
                : large
                  ? "mt-2 text-3xl sm:text-4xl"
                  : "mt-1.5 text-2xl"
            }`}
          >
            {value}
          </p>
        </div>
        <span
          className={`grid shrink-0 place-items-center text-sky-400/80 ${
            compact
              ? "h-7 w-7 rounded-lg bg-white/[0.03]"
              : large
                ? "h-11 w-11 rounded-xl bg-sky-500/10"
                : "h-8 w-8 rounded-lg bg-sky-500/10"
          }`}
        >
          <Icon size={compact ? 14 : large ? 20 : 16} />
        </span>
      </div>
      {!compact && (
        <div className={`flex items-center gap-1 ${large ? "mt-3 text-sm" : "mt-2 text-xs"}`}>
          <span
            className={`inline-flex items-center gap-0.5 font-medium ${
              positive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {positive ? (
              <ArrowUpRight size={large ? 15 : 13} />
            ) : (
              <ArrowDownRight size={large ? 15 : 13} />
            )}
            {trend}
          </span>
          <span className="text-zinc-500">vs vorige week</span>
        </div>
      )}
      <div
        className={
          compact ? "mt-2 h-6 opacity-70" : large ? "mt-4 h-16" : "mt-3 h-10"
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={stroke}
              strokeWidth={compact ? 1.5 : 2}
              fill={`url(#${gid})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }

  return card;
}

const tooltipStyle = {
  contentStyle: {
    background: "#0f141d",
    border: "1px solid #232937",
    borderRadius: 10,
    fontSize: 12,
  },
  labelStyle: { color: "#8a91a3" },
  itemStyle: { color: "#e8ebf4" },
};

export function TrendChart({
  data,
}: {
  data: { week: string; omzet: number; offertes: number }[];
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
          <XAxis
            dataKey="week"
            stroke="#8a91a3"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#232937" }}
          />
          <YAxis
            stroke="#8a91a3"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip {...tooltipStyle} />
          <Line
            type="monotone"
            dataKey="omzet"
            name="Omzet (k€)"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="offertes"
            name="Offertes"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Funnel({
  stages,
}: {
  stages: { label: string; value: number }[];
}) {
  const max = Math.max(...stages.map((s) => s.value));
  return (
    <div className="space-y-2.5">
      {stages.map((s, i) => {
        const pct = Math.round((s.value / max) * 100);
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-zinc-400">{s.label}</span>
              <span className="font-mono text-zinc-300">{s.value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
                style={{ width: `${pct}%`, opacity: 1 - i * 0.1 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
