"use client";

import { Panel, TrendChart, Funnel } from "@/components/dashboard/widgets";
import type { ChartWeek, FunnelStage } from "@/components/dashboard/mission-data";

export default function DashboardHomeCharts({
  trend,
  funnel,
}: {
  trend: ChartWeek[];
  funnel: FunnelStage[];
}) {
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
        <TrendChart data={trend} />
      </Panel>

      <Panel title="Sales-funnel">
        <Funnel stages={funnel} />
      </Panel>
    </div>
  );
}
