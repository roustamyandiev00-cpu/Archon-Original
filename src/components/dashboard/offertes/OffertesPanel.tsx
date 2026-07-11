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
    <Card className="overflow-hidden border-white/10 bg-zinc-950/50">
      <CardHeader className="gap-4 border-white/10 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold text-zinc-50">
            Offertes
          </CardTitle>
          <CardDescription className="max-w-xl text-sm leading-relaxed text-zinc-400">
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

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
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

        <OffertesDataTable
          offertes={offertes}
          isDemo={isDemo}
          showFilters={showFilters}
        />
      </CardContent>
    </Card>
  );
}
