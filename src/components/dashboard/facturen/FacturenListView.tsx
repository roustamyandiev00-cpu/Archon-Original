"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Euro,
  Plus,
  Receipt,
  Send,
} from "lucide-react";
import FacturenDataTable, {
  type FactuurListItem,
} from "@/components/dashboard/facturen/FacturenDataTable";
import FacturenSectionNav from "@/components/dashboard/facturen/FacturenSectionNav";
import { Badge } from "@/components/ui/badge";
import { primaryActionClass } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatEuro } from "@/lib/offertes";

export default function FacturenListView({
  facturen,
  isDemo,
  hasCompany,
  stats,
}: {
  facturen: FactuurListItem[];
  isDemo: boolean;
  hasCompany: boolean;
  stats: {
    maandOmzet: number;
    verzonden: number;
    betaald: number;
    openstaand: number;
  };
}) {
  const statCards = [
    { label: "Omzet deze maand", value: formatEuro(stats.maandOmzet), icon: Euro },
    { label: "Verzonden", value: String(stats.verzonden), icon: Send },
    { label: "Betaald", value: String(stats.betaald), icon: CheckCircle2 },
    { label: "Openstaand", value: formatEuro(stats.openstaand), icon: Receipt },
  ];

  return (
    <div className="facturen-list-view space-y-6">
      <FacturenSectionNav />

      <header className="flex flex-col gap-4 border-b border-zinc-200/80 pb-6 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Operatie / Facturen
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Facturen
            </h1>
            {isDemo && <Badge variant="warning">Demo</Badge>}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Alle opgeslagen facturen en proforma&apos;s. Maak een nieuwe via{" "}
            <Link
              href="/dashboard/facturen"
              className="font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              Nieuwe factuur
            </Link>
            .
          </p>
        </div>

        <Link href="/dashboard/facturen" className={primaryActionClass}>
          <Plus size={15} />
          Nieuwe factuur
        </Link>
      </header>

      {!hasCompany && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Je account is nog niet aan een bedrijf gekoppeld.
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/40"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div>
                <CardDescription className="uppercase tracking-wider">
                  {stat.label}
                </CardDescription>
                <CardTitle className="mt-2 font-mono text-2xl text-zinc-900 dark:text-zinc-50">
                  {stat.value}
                </CardTitle>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                <stat.icon size={18} />
              </span>
            </CardHeader>
          </Card>
        ))}
      </section>

      <FacturenDataTable facturen={facturen} isDemo={isDemo} />
    </div>
  );
}
