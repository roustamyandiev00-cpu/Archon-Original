import { Suspense } from "react";
import dynamic from "next/dynamic";
import type { ChartsData } from "@/components/dashboard/mission-data";

const DashboardHomeCharts = dynamic(
  () => import("@/components/dashboard/DashboardHomeCharts"),
  {
    loading: () => <ChartsSkeleton />,
  },
);

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="h-80 animate-pulse rounded-2xl border border-white/10 bg-zinc-900/60 lg:col-span-2" />
      <div className="h-80 animate-pulse rounded-2xl border border-white/10 bg-zinc-900/60" />
    </div>
  );
}

export default function DashboardChartsSection({
  charts,
}: {
  charts: ChartsData;
}) {
  return (
    <Suspense fallback={<ChartsSkeleton />}>
      <DashboardHomeCharts trend={charts.trend} funnel={charts.funnel} />
    </Suspense>
  );
}
