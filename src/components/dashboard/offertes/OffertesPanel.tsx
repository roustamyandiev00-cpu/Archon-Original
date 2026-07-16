"use client";

import { useState } from "react";
import OffertesDataTable, {
  OFFERTE_COLUMN_OPTIONS,
  defaultOfferteColumnVisibility,
  type OfferteColumnVisibility,
} from "@/components/dashboard/offertes/OffertesDataTable";
import type { OfferteListRow } from "@/components/dashboard/offertes/OffertesView";
import DataPanelToolbar from "@/components/dashboard/DataPanelToolbar";
import { exportOffertesCsv } from "@/components/dashboard/table-exports";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OffertesPanel({
  offertes,
  isDemo,
}: {
  offertes: OfferteListRow[];
  isDemo: boolean;
}) {
  const [showFilters, setShowFilters] = useState(true);
  const [columnVisibility, setColumnVisibility] = useState<OfferteColumnVisibility>(
    defaultOfferteColumnVisibility,
  );

  const openCount = offertes.filter((o) =>
    ["concept", "verzonden", "bekeken"].includes(o.status_new ?? ""),
  ).length;
  const acceptedCount = offertes.filter(
    (o) => o.status_new === "geaccepteerd",
  ).length;

  return (
    <Card className="dashboard-data-panel flex h-full min-h-0 flex-col overflow-hidden border-white/10 bg-zinc-950/50">
      <CardHeader className="dashboard-data-panel-header gap-3 border-white/10 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-semibold text-zinc-50">
            Offertes
          </CardTitle>
          <CardDescription className="dashboard-data-panel-desc max-w-xl text-sm leading-relaxed text-zinc-400">
            Beheer je offertes, volg de status en verstuur voorstellen naar
            klanten.
          </CardDescription>
        </div>

        <DataPanelToolbar
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((value) => !value)}
          columns={OFFERTE_COLUMN_OPTIONS}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={(id, visible) =>
            setColumnVisibility((current) => ({ ...current, [id]: visible }))
          }
          onExport={() => exportOffertesCsv(offertes)}
          exportLabel="Exporteer offertes"
        />
      </CardHeader>

      <CardContent className="dashboard-data-panel-body flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge variant="info">
            {offertes.length.toLocaleString("nl-BE")} offertes
          </Badge>
          <Badge variant={openCount > 0 ? "warning" : "default"}>
            {openCount} open
          </Badge>
          <Badge variant={acceptedCount > 0 ? "success" : "default"}>
            {acceptedCount} geaccepteerd
          </Badge>
          {isDemo && <Badge variant="warning">Demo</Badge>}
        </div>

        <div className="dashboard-table-area">
          <OffertesDataTable
            offertes={offertes}
            isDemo={isDemo}
            showFilters={showFilters}
            columnVisibility={columnVisibility}
          />
        </div>
      </CardContent>
    </Card>
  );
}
