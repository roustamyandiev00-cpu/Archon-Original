"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import NieuweOfferteActions from "@/components/dashboard/offertes/NieuweOfferteActions";
import NieuweOfferteClient from "@/components/dashboard/offertes/NieuweOfferteClient";
import OffertesPanel from "@/components/dashboard/offertes/OffertesPanel";
import type { OfferteDocumentContext } from "@/components/dashboard/offertes/OfferteForm";
import type { PrijslijstPickItem } from "@/components/dashboard/prijslijst/types";
import { Button } from "@/components/ui/button";

export type OfferteListRow = {
  id: number;
  nummer: string | null;
  klant: string | null;
  bedrag: number | null;
  datum: string | null;
  geldig_tot: string | null;
  status_new: string | null;
  email: string | null;
  phone: string | null;
};

type Customer = {
  id: number;
  name: string;
  company_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  btw?: string | null;
};

type CreateMode = "manueel" | "ai";

type Props = {
  offertes: OfferteListRow[];
  isDemo: boolean;
  companyId: number | null;
  agentName: string;
  customers: Customer[];
  documentContext: OfferteDocumentContext;
  prijslijstItems?: PrijslijstPickItem[];
};

export default function OffertesView({
  offertes,
  isDemo,
  companyId,
  agentName,
  customers,
  documentContext,
  prijslijstItems = [],
}: Props) {
  const [createMode, setCreateMode] = useState<CreateMode | null>(null);

  if (createMode) {
    return (
      <div className="space-y-4">
        {createMode === "ai" && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setCreateMode(null)}
            className="gap-2 text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft size={16} />
            Terug naar offertes
          </Button>
        )}
        <NieuweOfferteClient
          agentName={agentName}
          customers={customers}
          documentContext={documentContext}
          mode={createMode}
          prijslijstItems={prijslijstItems}
          hideFormBackLink={createMode === "manueel"}
          onBack={() => setCreateMode(null)}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-page flex h-full min-h-0 flex-col gap-2 lg:gap-0">
      <header className="dashboard-page-header flex shrink-0 flex-col gap-2 border-b border-white/10 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Operatie / Offertes
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-50">
            Offertes
          </h1>
          <p className="mt-1 hidden text-sm text-zinc-400 sm:block lg:hidden xl:block">
            Maak, verstuur en volg je offertes op.
          </p>
        </div>
        <NieuweOfferteActions
          onManueel={() => setCreateMode("manueel")}
          onAi={() => setCreateMode("ai")}
        />
      </header>

      {!companyId && (
        <div className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
          Je account is nog niet aan een bedrijf gekoppeld.
        </div>
      )}

      <div className="dashboard-page-content">
        <OffertesPanel offertes={offertes} isDemo={isDemo} />
      </div>
    </div>
  );
}
