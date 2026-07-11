"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import FacturenPanel from "@/components/dashboard/facturen/FacturenPanel";
import type { FactuurListItem } from "@/components/dashboard/facturen/FacturenDataTable";
import { primaryActionClass } from "@/components/ui/button";

export default function FacturenView({
  facturen,
  isDemo,
  hasCompany,
}: {
  facturen: FactuurListItem[];
  isDemo: boolean;
  hasCompany: boolean;
}) {
  return (
    <div className="dashboard-page space-y-3 lg:space-y-0">
      <header className="dashboard-page-header flex flex-col gap-2 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between lg:gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Operatie / Facturen
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-50">
            Facturen
          </h1>
          <p className="mt-1 hidden text-sm text-zinc-400 sm:block lg:hidden xl:block">
            Maak, verstuur en volg je facturen en proforma&apos;s op.
          </p>
        </div>
        <Link href="/dashboard/facturen/nieuw" className={primaryActionClass}>
          <Plus size={15} />
          Nieuwe factuur
        </Link>
      </header>

      {!hasCompany && (
        <div className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
          Je account is nog niet aan een bedrijf gekoppeld.
        </div>
      )}

      <div className="dashboard-page-content">
        <FacturenPanel facturen={facturen} isDemo={isDemo} />
      </div>
    </div>
  );
}
