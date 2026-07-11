"use client";

import { useState } from "react";
import Link from "next/link";
import { Cog, Download, EyeOff, Plus, SlidersHorizontal } from "lucide-react";
import FacturenDataTable, {
  type FactuurListItem,
} from "@/components/dashboard/facturen/FacturenDataTable";
import { Badge } from "@/components/ui/badge";
import { Button, primaryActionClass } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function FacturenPanel({
  facturen,
  isDemo,
}: {
  facturen: FactuurListItem[];
  isDemo: boolean;
}) {
  const [showFilters, setShowFilters] = useState(true);

  const openCount = facturen.filter(
    (f) =>
      f.document_type === "factuur" &&
      !f.paid_at &&
      f.status !== "betaald",
  ).length;
  const paidCount = facturen.filter(
    (f) => f.paid_at || f.status === "betaald",
  ).length;

  return (
    <Card className="dashboard-data-panel overflow-hidden border-white/10 bg-zinc-950/50">
      <CardHeader className="dashboard-data-panel-header gap-3 border-white/10 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-semibold text-zinc-50">
            Facturen
          </CardTitle>
          <CardDescription className="dashboard-data-panel-desc max-w-xl text-sm leading-relaxed text-zinc-400">
            Beheer facturen en proforma&apos;s, volg betalingen en verstuur
            via Peppol of e-mail.
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
          <Button type="button" variant="ghost" aria-label="Exporteer facturen">
            <Download size={15} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Link href="/dashboard/facturen/nieuw" className={primaryActionClass}>
            <Plus size={15} />
            Nieuwe factuur
          </Link>
        </div>
      </CardHeader>

      <CardContent className="dashboard-data-panel-body">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge variant="info">
            {facturen.length.toLocaleString("nl-BE")} documenten
          </Badge>
          <Badge variant={openCount > 0 ? "warning" : "default"}>
            {openCount} openstaand
          </Badge>
          <Badge variant={paidCount > 0 ? "success" : "default"}>
            {paidCount} betaald
          </Badge>
          {isDemo && <Badge variant="warning">Demo</Badge>}
        </div>

        <div className="dashboard-table-area">
          <FacturenDataTable
            facturen={facturen}
            isDemo={isDemo}
            showFilters={showFilters}
          />
        </div>
      </CardContent>
    </Card>
  );
}
