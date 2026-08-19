"use client";

import { useState } from "react";
import {
  Activity,
  Plus,
  Settings,
  User,
  Download,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";

interface ActivityItem {
  id: string;
  type: "bedrijven" | "gebruikers" | "ai" | "systeem";
  icon: React.ReactNode;
  description: string;
  actor: string;
  time: string;
  link?: string;
}

export default function RecentActivityFeed() {
  const [activeFilter, setActiveFilter] = useState<"alles" | "bedrijven" | "gebruikers" | "ai" | "systeem">("alles");

  // Sample activities matching prompt examples
  const activities: ActivityItem[] = [
    {
      id: "a1",
      type: "bedrijven",
      icon: <Plus size={12} className="text-[#21B7E8]" />,
      description: "heeft bedrijf Bouwbedrijf De Vlaming toegevoegd",
      actor: "Alex Admin",
      time: "5 minuten geleden",
      link: "/admin/companies",
    },
    {
      id: "a2",
      type: "ai",
      icon: <Settings size={12} className="text-[#a78bfa]" />,
      description: "AI-agent Sales Pro is aangepast",
      actor: "Systeem",
      time: "25 minuten geleden",
      link: "/admin/ai-agents",
    },
    {
      id: "a3",
      type: "gebruikers",
      icon: <User size={12} className="text-[#20D58A]" />,
      description: "heeft abonnement Pro gestart voor Renovatie Peeters NV",
      actor: "Sarah De Cock",
      time: "1 uur geleden",
      link: "/admin/crm",
    },
    {
      id: "a4",
      type: "systeem",
      icon: <Download size={12} className="text-zinc-400" />,
      description: "Rapport 'AI-verbruiksrapport' is geëxporteerd",
      actor: "Alex Admin",
      time: "2 uur geleden",
    },
    {
      id: "a5",
      type: "ai",
      icon: <CheckCircle size={12} className="text-[#20D58A]" />,
      description: "Goedkeuring voor offerte-opvolging is afgerond",
      actor: "Nova Agent",
      time: "3 uur geleden",
      link: "/admin/goedkeuringen",
    },
    {
      id: "a6",
      type: "systeem",
      icon: <AlertTriangle size={12} className="text-[#F05268]" />,
      description: "Stripe Webhook 'invoice.payment_failed' is mislukt",
      actor: "Stripe",
      time: "4 uur geleden",
    },
  ];

  const filteredActivities = activities.filter(
    (item) => activeFilter === "alles" || item.type === activeFilter
  );

  return (
    <Card className="bg-[#252329] border-white/5 shadow-xl">
      <CardHeader className="flex flex-col gap-4 border-b border-white/5 pb-4 md:flex-row md:items-center md:justify-between">
        {/* Left: Title */}
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
            <Activity size={14} className="text-[#21B7E8]" />
          </span>
          <CardTitle className="text-sm font-semibold text-zinc-100">
            Recente platformactiviteit
          </CardTitle>
        </div>

        {/* Right: Filters */}
        <div className="flex flex-wrap rounded-lg bg-zinc-900 border border-white/10 p-0.5">
          {(["alles", "bedrijven", "gebruikers", "ai", "systeem"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                activeFilter === filter
                  ? "bg-white/5 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between p-4 transition-colors hover:bg-white/[0.01]"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="mt-0.5 p-1.5 rounded-lg bg-zinc-900 border border-white/5 shrink-0">
                  {act.icon}
                </span>
                <div className="min-w-0 text-xs">
                  <span className="font-semibold text-zinc-200">{act.actor}</span>{" "}
                  <span className="text-zinc-400">{act.description}</span>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">{act.time}</p>
                </div>
              </div>

              {act.link && (
                <a
                  href={act.link}
                  className="rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#21B7E8] shrink-0 ml-4"
                >
                  Details
                </a>
              )}
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-500">
              Geen activiteiten gevonden voor dit filter.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
