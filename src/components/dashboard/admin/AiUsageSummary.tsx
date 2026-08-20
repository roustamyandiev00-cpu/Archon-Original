"use client";

import { Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AiUsageSummaryProps {
  tokensUsedTotal: string;
  aiCostTotal: string;
}

export default function AiUsageSummary({
  tokensUsedTotal = "4.218",
  aiCostTotal = "€127",
}: AiUsageSummaryProps) {
  const metrics = [
    { label: "Tokens vandaag", value: "84.210" },
    { label: "Tokens deze maand", value: tokensUsedTotal },
    { label: "AI-kosten", value: aiCostTotal },
    { label: "Kosten per model", value: "GPT-4o: 68% · Claude: 32%" },
    { label: "Meest gebruikte agent", value: "Nova (Lead Agent)" },
    { label: "Bedrijf hoogste verbruik", value: "Bouwbedrijf De Vlaming" },
  ];

  return (
    <Card className="bg-[#252329] border-white/5">
      <CardHeader className="flex flex-row items-center gap-2.5 py-4 border-b border-white/5">
        <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
          <Zap size={14} className="text-[#a78bfa]" />
        </span>
        <CardTitle className="text-xs font-semibold text-zinc-100">AI-verbruik</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <ul className="space-y-2">
          {metrics.map((m) => (
            <li
              key={m.label}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] px-3 py-2.5"
            >
              <span className="text-xs font-medium text-zinc-400">{m.label}</span>
              <span className="font-mono text-xs font-semibold text-zinc-200 text-right max-w-[180px] truncate">
                {m.value}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
