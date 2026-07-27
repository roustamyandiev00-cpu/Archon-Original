"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import FacturenDataTable, {
  FACTUUR_COLUMN_OPTIONS,
  defaultFactuurColumnVisibility,
  type FactuurColumnVisibility,
  type FactuurListItem,
} from "@/components/dashboard/facturen/FacturenDataTable";
import DataPanelToolbar from "@/components/dashboard/DataPanelToolbar";
import { exportFacturenCsv } from "@/components/dashboard/table-exports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function FacturenPanel({
  facturen,
  loadError,
  isDemo,
}: {
  facturen: FactuurListItem[];
  loadError: string | null;
  isDemo: boolean;
}) {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(true);
  const [columnVisibility, setColumnVisibility] = useState<FactuurColumnVisibility>(
    defaultFactuurColumnVisibility,
  );

  const conceptCount = facturen.filter((f) => f.status === "concept").length;
  const openCount = facturen.filter(
    (f) =>
      f.document_type === "factuur" &&
      !f.paid_at &&
      !["concept", "betaald", "vervallen"].includes(f.status ?? ""),
  ).length;
  const paidCount = facturen.filter(
    (f) => f.paid_at || f.status === "betaald",
  ).length;
  const expiredCount = facturen.filter((f) => f.status === "vervallen").length;

  return (
    <Card className="dashboard-data-panel flex h-auto min-h-0 flex-col overflow-visible border-white/10 bg-zinc-950/50 lg:h-full lg:overflow-hidden">
      <CardHeader className="dashboard-data-panel-header gap-3 border-white/10 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-semibold text-zinc-50">
            Facturen
          </CardTitle>
          <CardDescription className="dashboard-data-panel-desc max-w-xl text-sm leading-relaxed text-zinc-400">
            Beheer facturen, bewaak vervaldata en volg betalingen op.
          </CardDescription>
        </div>

        {!loadError ? (
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
          />
        ) : null}
      </CardHeader>

      <CardContent className="dashboard-data-panel-body flex min-h-0 flex-1 flex-col overflow-visible lg:overflow-hidden">
        {!loadError ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge variant="info">Alle {facturen.length}</Badge>
            <Badge variant={conceptCount > 0 ? "warning" : "default"}>
              Concept {conceptCount}
            </Badge>
            <Badge variant={openCount > 0 ? "warning" : "default"}>
              Openstaand {openCount}
            </Badge>
            <Badge variant={paidCount > 0 ? "success" : "default"}>
              Betaald {paidCount}
            </Badge>
            <Badge variant={expiredCount > 0 ? "danger" : "default"}>
              Vervallen {expiredCount}
            </Badge>
            {isDemo ? <Badge variant="warning">Demo</Badge> : null}
          </div>
        ) : null}

        <div className="dashboard-table-area">
          {loadError ? (
            <div
              role="alert"
              className="grid min-h-64 flex-1 place-items-center rounded-xl border border-rose-500/20 bg-rose-500/[0.04] px-6 py-12 text-center"
            >
              <div className="max-w-sm">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                  <AlertCircle size={22} />
                </span>
                <h3 className="mt-3 text-base font-semibold text-zinc-50">
                  Facturen konden niet laden
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  {loadError}
                </p>
                <Button
                  type="button"
                  onClick={() => router.refresh()}
                  className="mt-4 gap-2"
                >
                  <RefreshCw size={15} />
                  Opnieuw proberen
                </Button>
              </div>
            </div>
          ) : (
            <FacturenDataTable
              facturen={facturen}
              isDemo={isDemo}
              showFilters={showFilters}
              columnVisibility={columnVisibility}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
