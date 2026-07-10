"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AiUsagePoint } from "@/components/dashboard/admin/company-detail-data";

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

export default function CompanyAiUsageChart({
  data,
  height = 260,
}: {
  data: AiUsagePoint[];
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="companyTokens" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="companyCost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.26} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="tokens"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
          />
          <YAxis
            yAxisId="cost"
            orientation="right"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `€${value}`}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value, name) => {
              if (name === "cost") return [`€ ${Number(value).toLocaleString("nl-BE")}`, "Cost"];
              return [Number(value).toLocaleString("nl-BE"), name === "tokens" ? "Tokens" : "Requests"];
            }}
          />
          <Area
            yAxisId="tokens"
            type="monotone"
            dataKey="tokens"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="url(#companyTokens)"
          />
          <Area
            yAxisId="cost"
            type="monotone"
            dataKey="cost"
            stroke="#a78bfa"
            strokeWidth={2}
            fill="url(#companyCost)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
