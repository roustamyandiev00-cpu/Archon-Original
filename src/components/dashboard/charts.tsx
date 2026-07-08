"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

export type Serie = { key: string; color: string; label: string };

export function LineTrend({
  data,
  xKey = "week",
  series,
  height = 224,
}: {
  data: Record<string, string | number>[];
  xKey?: string;
  series: Serie[];
  height?: number;
}) {
  const empty = data.length === 0;
  if (empty) {
    return (
      <div
        className="grid place-items-center text-sm text-zinc-600"
        style={{ height }}
      >
        Nog geen data
      </div>
    );
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="#1b2130" vertical={false} />
          <XAxis
            dataKey={xKey}
            stroke="#8a91a3"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#232937" }}
          />
          <YAxis stroke="#8a91a3" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip {...tooltipStyle} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
