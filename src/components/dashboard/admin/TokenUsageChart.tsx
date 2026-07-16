"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type TokenUsageDataPoint = {
  date: string;
  tokens: number;
  cost: number;
};

export function TokenUsageChart({ data }: { data: TokenUsageDataPoint[] }) {
  return (
    <ChartContainer
      config={{
        tokens: {
          label: "Tokens",
          color: "hsl(var(--chart-1))",
        },
        cost: {
          label: "Cost (€)",
          color: "hsl(var(--chart-2))",
        },
      }}
    >
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="fillTokens" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillCost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-800" />
          <XAxis
            dataKey="date"
            className="text-xs text-zinc-400"
            tickLine={false}
            axisLine={false}
          />
          <YAxis className="text-xs text-zinc-400" tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="tokens"
            stroke="hsl(var(--chart-1))"
            fillOpacity={1}
            fill="url(#fillTokens)"
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="hsl(var(--chart-2))"
            fillOpacity={1}
            fill="url(#fillCost)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
