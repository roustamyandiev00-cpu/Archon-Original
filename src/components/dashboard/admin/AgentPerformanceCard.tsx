"use client";

import { Bot } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AgentPerformanceCardProps {
  activeAgentsCount?: number;
}

export default function AgentPerformanceCard({
  activeAgentsCount = 4,
}: AgentPerformanceCardProps) {
  const metrics = [
    { label: "Actieve agents", value: String(activeAgentsCount) },
    { label: "Gevoerde gesprekken", value: "342" },
    { label: "Leads verzameld", value: "89" },
    { label: "Conversieratio", value: "26,0%" },
    { label: "Mislukte acties", value: "1 (laatste 24u)" },
  ];

  return (
    <Card className="bg-[#252329] border-white/5">
      <CardHeader className="flex flex-row items-center gap-2.5 py-4 border-b border-white/5">
        <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
          <Bot size={14} className="text-[#a78bfa]" />
        </span>
        <CardTitle className="text-xs font-semibold text-zinc-100">Agentprestaties</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <ul className="space-y-2">
          {metrics.map((m) => (
            <li
              key={m.label}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] px-3 py-2.5"
            >
              <span className="text-xs font-medium text-zinc-400">{m.label}</span>
              <span className="font-mono text-xs font-semibold text-zinc-200">
                {m.value}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
