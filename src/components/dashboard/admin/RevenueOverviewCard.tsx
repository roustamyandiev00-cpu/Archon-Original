"use client";

import { useState } from "react";
import { TrendingUp, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RevenueChart } from "@/components/dashboard/admin/CeoCharts";
import type { ChartPoint } from "@/components/dashboard/admin/ceo-demo-data";
import { cn } from "@/components/ui/utils";

interface RevenueOverviewCardProps {
  data: ChartPoint[];
  revenueSource?: "invoices" | "estimate";
}

export default function RevenueOverviewCard({
  data,
  revenueSource = "estimate",
}: RevenueOverviewCardProps) {
  const [activeTab, setActiveTab] = useState<"mrr" | "omzet" | "abonnementen">("mrr");
  const [periodFilter, setPeriodFilter] = useState<"wekelijks" | "maandelijks" | "kwartaal" | "jaarlijks">("maandelijks");

  // Summary statistics mapping
  const stats = [
    { label: "MRR", value: "€2.254" },
    { label: "Groei", value: "+8,4%" },
    { label: "Gem. per bedrijf", value: "€49" },
    { label: "Churn", value: "1,8%" },
  ];

  return (
    <Card className="bg-[#252329] border-white/5">
      <CardHeader className="flex flex-col gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Info */}
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
            <TrendingUp size={16} className="text-[#21B7E8]" />
          </span>
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-100">Revenue-overzicht</CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-0.5">
              {revenueSource === "invoices"
                ? "Betaalde Stripe-facturen per maand"
                : "Geschatte MRR op basis van geconfigureerde plannen"}
            </CardDescription>
          </div>
        </div>

        {/* Right: Tabs & Period Selection */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tabs */}
          <div className="flex rounded-lg bg-zinc-900 border border-white/10 p-0.5">
            {(["mrr", "omzet", "abonnementen"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  activeTab === tab
                    ? "bg-[#21B7E8]/15 text-[#21B7E8]"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Period Filter */}
          <div className="flex rounded-lg bg-zinc-900 border border-white/10 p-0.5">
            {(["wekelijks", "maandelijks", "kwartaal", "jaarlijks"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setPeriodFilter(filter)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-medium capitalize transition-colors",
                  periodFilter === filter
                    ? "bg-white/5 text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-400"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Lijngrafiek */}
        <div className="w-full">
          <RevenueChart data={data} />
        </div>

        {/* Statistics summaries beneath chart */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/5 pt-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.01] px-4 py-3"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {stat.label}
              </span>
              <span className="font-mono text-base font-semibold text-zinc-200">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
