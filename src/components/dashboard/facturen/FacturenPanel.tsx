"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import FacturenDataTable, {
  FACTUUR_COLUMN_OPTIONS,
  defaultFactuurColumnVisibility,
  type FactuurColumnVisibility,
  type FactuurListItem,
} from "@/components/dashboard/facturen/FacturenDataTable";
import DataPanelToolbar from "@/components/dashboard/DataPanelToolbar";
import { exportFacturenCsv } from "@/components/dashboard/table-exports";
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
  const [columnVisibility, setColumnVisibility] = useState<FactuurColumnVisibility>(
    defaultFactuurColumnVisibility,
  );

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

        <DataPanelToolbar
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((value) => !value)}
          columns={FACTUUR_COLUMN_OPTIONS}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={(id, visible) =>
            setColumnVisibility((current) => ({ ...current, [id]: visible }))
          }
          onExport={() => exportFacturenCsv(facturen)}
          exportLabel="Exporteer facturen"
        >
          <Link href="/dashboard/facturen/nieuw" className={primaryActionClass}>
            <Plus size={15} />
            Nieuwe factuur
          </Link>
        </DataPanelToolbar>
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
            columnVisibility={columnVisibility}
          />
        </div>
      </CardContent>
    </Card>
  );
}
