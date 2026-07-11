"use client";

import { useState } from "react";
import { Cog, Download, EyeOff, SlidersHorizontal } from "lucide-react";
import OffertesDataTable from "@/components/dashboard/offertes/OffertesDataTable";
import type { OfferteListRow } from "@/components/dashboard/offertes/OffertesView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const openCount = offertes.filter((o) =>
    ["concept", "verzonden", "bekeken"].includes(o.status_new ?? ""),
  ).length;
  const acceptedCount = offertes.filter(
    (o) => o.status_new === "geaccepteerd",
  ).length;

  return (
    <Card className="dashboard-data-panel overflow-hidden border-white/10 bg-zinc-950/50">
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

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Button
            type="button"
            variant="ghost"
            aria-label={showFilters ? "Filters verbergen" : "Filters tonen"}
            onClick={() => setShowFilters((value) => !value)}
          >
            {showFilters ? <EyeOff size={15} /> : <SlidersHorizontal size={15} />}
            <span className="hidden sm:inline">
              {showFilters ? "Hide" : "Filters"}
            </span>
          </Button>
          <Button type="button" variant="ghost" aria-label="Kolommen aanpassen">
            <Cog size={15} />
            <span className="hidden sm:inline">Customize</span>
          </Button>
          <Button type="button" variant="ghost" aria-label="Exporteer offertes">
            <Download size={15} />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="dashboard-data-panel-body">
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
          />
        </div>
      </CardContent>
    </Card>
  );
}
