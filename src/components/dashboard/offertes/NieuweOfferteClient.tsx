"use client";

import { useState } from "react";
import NovaOffertePanel from "@/components/dashboard/offertes/NovaOffertePanel";
import OfferteForm, {
  type OfferteDocumentContext,
  type OfferteFormInitial,
} from "@/components/dashboard/offertes/OfferteForm";
import type { OfferteLijnInput } from "@/lib/offertes";

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

type OfferteMode = "manueel" | "ai" | "beide";

export default function NieuweOfferteClient({
  agentName = "Nova",
  customers,
  documentContext,
  mode = "beide",
}: {
  agentName?: string;
  customers: Customer[];
  documentContext: OfferteDocumentContext;
  mode?: OfferteMode;
}) {
  const [seed, setSeed] = useState<OfferteFormInitial | undefined>();
  const [showManualForm, setShowManualForm] = useState(mode === "manueel");

  function applyDraft(draft: {
    customerId: number | null;
    klant: string;
    notes: string;
    lines: OfferteLijnInput[];
  }) {
    setSeed({
      customerId: draft.customerId ? String(draft.customerId) : "",
      klantVrij: draft.klant,
      datum: new Date().toISOString().slice(0, 10),
      geldigTot: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().slice(0, 10);
      })(),
      notes: draft.notes,
      lines: draft.lines,
    });
    setShowManualForm(true);
  }

  return (
    <div className="space-y-6">
      {mode !== "manueel" && (
        <NovaOffertePanel
          agentName={agentName}
          customers={customers}
          onApplyDraft={applyDraft}
        />
      )}
      {showManualForm ? (
        <OfferteForm
          customers={customers}
          documentContext={documentContext}
          seedDraft={seed}
        />
      ) : (
        <div className="text-center py-6 border border-white/5 rounded-2xl bg-zinc-950/20">
          <span className="text-zinc-500 text-sm">Of wil je direct handmatig beginnen? </span>
          <button
            type="button"
            onClick={() => setShowManualForm(true)}
            className="text-sm font-bold text-sky-400 hover:text-sky-300 transition-colors underline"
          >
            Start handmatig invullen
          </button>
        </div>
      )}
    </div>
  );
}
