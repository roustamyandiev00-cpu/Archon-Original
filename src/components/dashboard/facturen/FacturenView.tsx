"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import FacturenPanel from "@/components/dashboard/facturen/FacturenPanel";
import type { FactuurListItem } from "@/components/dashboard/facturen/FacturenDataTable";

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
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Operatie / Facturen
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Facturen
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Maak, verstuur en volg je facturen en proforma&apos;s op.
          </p>
        </div>
        <Link
          href="/dashboard/facturen/nieuw"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-transparent bg-zinc-100 px-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          <Plus size={15} />
          Nieuwe factuur
        </Link>
      </header>

      {!hasCompany && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Je account is nog niet aan een bedrijf gekoppeld.
        </div>
      )}

      <FacturenPanel facturen={facturen} isDemo={isDemo} />
    </div>
  );
}
