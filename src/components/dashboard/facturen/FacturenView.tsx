"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import FacturenPanel from "@/components/dashboard/facturen/FacturenPanel";
import type { FactuurListItem } from "@/components/dashboard/facturen/FacturenDataTable";
import type { FacturenAccessIssue } from "@/lib/facturen/load-facturen-data";

export default function FacturenView({
  facturen,
  loadError,
  isDemo,
  hasCompany,
  accessIssue,
}: {
  facturen: FactuurListItem[];
  loadError: string | null;
  isDemo: boolean;
  hasCompany: boolean;
  accessIssue: FacturenAccessIssue;
}) {
  const accessError =
    accessIssue === "unauthenticated"
      ? "Je sessie ontbreekt of is verlopen. Meld je opnieuw aan om je facturen te bekijken."
      : accessIssue === "missing-company"
        ? "Je account is niet aan een actief bedrijf gekoppeld."
        : null;

  return (
    <div className="dashboard-page flex h-full min-h-0 flex-col gap-2 lg:gap-0">
      <header className="dashboard-page-header flex shrink-0 flex-col gap-2 border-b border-white/10 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Operatie / Facturen
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-50">
            Facturen
          </h1>
          <p className="mt-1 hidden text-sm text-zinc-400 sm:block lg:hidden xl:block">
            Maak, verstuur en volg facturen en betalingen op.
          </p>
        </div>
        {!accessIssue ? (
          <Link
            href="/dashboard/facturen/nieuw"
            className="dashboard-page-action-primary inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400 sm:w-auto"
          >
            <Plus size={16} />
            Nieuwe factuur
          </Link>
        ) : null}
      </header>

      {!hasCompany && !accessError && (
        <div className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
          Je account is nog niet aan een bedrijf gekoppeld.
        </div>
      )}

      <div className="dashboard-page-content">
        <FacturenPanel
          facturen={facturen}
          loadError={accessError ?? loadError}
          isDemo={isDemo}
        />
      </div>
    </div>
  );
}
