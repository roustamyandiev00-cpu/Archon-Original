"use client";

import { Panel, TrendChart, Funnel } from "@/components/dashboard/widgets";

const fallbackTrend = [
  { week: "W1", omzet: 42, offertes: 18 },
  { week: "W2", omzet: 48, offertes: 22 },
  { week: "W3", omzet: 45, offertes: 20 },
  { week: "W4", omzet: 58, offertes: 27 },
  { week: "W5", omzet: 61, offertes: 25 },
  { week: "W6", omzet: 70, offertes: 31 },
  { week: "W7", omzet: 66, offertes: 29 },
  { week: "W8", omzet: 78, offertes: 34 },
  { week: "W9", omzet: 84, offertes: 38 },
  { week: "W10", omzet: 92, offertes: 41 },
  { week: "W11", omzet: 88, offertes: 39 },
  { week: "W12", omzet: 101, offertes: 44 },
];

const fallbackFunnel = [
  { label: "Nieuwe leads", value: 148 },
  { label: "Gekwalificeerd", value: 96 },
  { label: "Offerte verzonden", value: 61 },
  { label: "Onderhandeling", value: 34 },
  { label: "Gewonnen", value: 21 },
];

export default function DashboardHomeCharts() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Panel
        title="Omzet & offertes — 12 weken"
        className="lg:col-span-2"
        action={
          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-400" /> Omzet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-400" /> Offertes
            </span>
          </div>
        }
      >
        <TrendChart data={fallbackTrend} />
      </Panel>

      <Panel title="Sales-funnel">
        <Funnel stages={fallbackFunnel} />
      </Panel>
    </div>
  );
}
