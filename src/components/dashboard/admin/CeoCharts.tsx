"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/components/dashboard/admin/ceo-demo-data";

const tooltipStyle = {
  contentStyle: {
    background: "#18181b",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    fontSize: 12,
    boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
  },
  labelStyle: { color: "#a1a1aa", marginBottom: 4 },
  itemStyle: { color: "#f4f4f5" },
};

export function RevenueChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartShell height={320}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="ceoRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `€${Math.round(v / 1000)}k`}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value) => [`€ ${Number(value).toLocaleString("nl-BE")}`, "MRR"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="url(#ceoRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function CompanyGrowthChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartShell height={320}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            {...tooltipStyle}
            formatter={(value) => [Number(value).toLocaleString("nl-BE"), "Bedrijven"]}
          />
          <Bar dataKey="companies" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function AiUsageChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartShell height={320}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="ceoAiRequests" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ceoAiCost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `€${v}`}
          />
          <Tooltip {...tooltipStyle} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="aiRequests"
            name="AI-verzoeken"
            stroke="#a78bfa"
            strokeWidth={2}
            fill="url(#ceoAiRequests)"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="aiCost"
            name="AI-kosten (€)"
            stroke="#fbbf24"
            strokeWidth={2}
            fill="url(#ceoAiCost)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function ChartShell({
  height,
  children,
}: {
  height: number;
  children: React.ReactNode;
}) {
  return <div style={{ height }}>{children}</div>;
}
