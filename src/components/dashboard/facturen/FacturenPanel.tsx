"use client";

import { useState } from "react";
import Link from "next/link";
import { Cog, Download, EyeOff, Plus, SlidersHorizontal } from "lucide-react";
import FacturenDataTable, {
  type FactuurListItem,
} from "@/components/dashboard/facturen/FacturenDataTable";
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
    <Card className="overflow-hidden border-white/10 bg-zinc-950/50">
      <CardHeader className="gap-4 border-white/10 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold text-zinc-50">
            Facturen
          </CardTitle>
          <CardDescription className="max-w-xl text-sm leading-relaxed text-zinc-400">
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
          <Link
            href="/dashboard/facturen/nieuw"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-transparent bg-zinc-100 px-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            <Plus size={15} />
            Nieuwe factuur
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
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

        <FacturenDataTable
          facturen={facturen}
          isDemo={isDemo}
          showFilters={showFilters}
        />
      </CardContent>
    </Card>
  );
}
