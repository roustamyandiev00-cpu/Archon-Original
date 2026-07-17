"use client";

import KlantenPanel from "@/components/dashboard/contacten/KlantenPanel";
import type { KlantRecord } from "@/components/dashboard/contacten/KlantForm";

export default function ContactenView({ klanten }: { klanten: KlantRecord[] }) {
  return (
    <div className="dashboard-page flex h-full min-h-0 flex-col gap-2 lg:gap-0">
      <header className="dashboard-page-header flex shrink-0 flex-col gap-2 border-b border-white/10 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Operatie / Contacten
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-50">
            Contacten
          </h1>
          <p className="mt-1 hidden text-sm text-zinc-400 sm:block lg:hidden xl:block">
            Beheer klanten met adres- en Peppol-gegevens voor e-facturatie.
          </p>
        </div>
      </header>

      <div className="dashboard-page-content">
        <KlantenPanel klanten={klanten} embedded />
      </div>
    </div>
  );
}
