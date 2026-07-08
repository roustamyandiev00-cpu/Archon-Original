"use client";

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
}: {
  label: string;
  value: string;
  trend: string;
  icon: StatIcon;
  data: { v: number }[];
  positive?: boolean;
}) {
  const Icon = statIcons[icon];
  const stroke = positive ? "#38bdf8" : "#e85a6b";
  const gid = `spark-${label.replace(/\s+/g, "")}`;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-sky-500/40 hover:shadow-[0_8px_30px_-12px_rgba(56,189,248,0.35)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-zinc-50">{value}</p>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
          <Icon size={16} />
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs">
        <span
          className={`inline-flex items-center gap-0.5 font-medium ${
            positive ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {trend}
        </span>
        <span className="text-zinc-500">vs vorige week</span>
      </div>
      <div className="mt-3 h-10">
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
              strokeWidth={2}
              fill={`url(#${gid})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
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
