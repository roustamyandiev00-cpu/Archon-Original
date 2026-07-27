"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Download,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { markFactuurAsVerzonden } from "@/app/dashboard/facturen/actions";
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";
import DocumentDownload from "@/components/dashboard/documenten/DocumentDownload";
import PeppolActions from "@/components/dashboard/documenten/PeppolActions";
import MarkFactuurPaidButton from "@/components/dashboard/facturen/MarkFactuurPaidButton";
import { Button } from "@/components/ui/button";
import { formatDate, formatEuro } from "@/lib/offertes";
import type { DocumentRow } from "@/components/dashboard/documenten/documentTemplate";

export type FactuurActivityItem = {
  label: string;
  at: string;
  detail?: string;
};

export type FactuurPaymentRow = {
  bedrag: number;
  datum: string | null;
  betaalmethode: string | null;
  referentie: string | null;
};

const PAYABLE_STATUSES = new Set([
  "verzonden",
  "herinnerd",
  "vervallen",
  "deels_betaald",
]);

function SidebarCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/[0.08] bg-zinc-900/55 p-4 shadow-sm ${className}`}
    >
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function FactuurDetailSidebar({
  factuurId,
  nummer,
  status,
  statusLabel,
  statusTone,
  statusDot,
  typeLabel,
  typeTone,
  typeDot,
  isProforma,
  isPaid,
  paidAt,
  paidAmount,
  openAmount,
  payments,
  aiContext,
  peppolConnected,
  peppolCanSend,
  buyerReference,
  structuredCommunication,
  peppolStatus,
  peppolLastError,
  currentTemplate,
  defaultTemplate,
  docValues,
  docRows,
}: {
  factuurId: number;
  nummer: string;
  status: string | null;
  statusLabel: string;
  statusTone: string;
  statusDot: string;
  typeLabel: string;
  typeTone: string;
  typeDot: string;
  isProforma: boolean;
  isPaid: boolean;
  paidAt: string | null;
  paidAmount: number;
  openAmount: number;
  payments: FactuurPaymentRow[];
  aiContext: {
    customerLabel: string;
    statusLabel: string;
    invoiceDate: string | null;
    dueDate: string | null;
    totalAmount: number;
    openAmount: number;
    lineCount: number;
    missingFields: string[];
    isProforma: boolean;
  };
  peppolConnected: boolean;
  peppolCanSend: boolean;
  buyerReference?: string | null;
  structuredCommunication?: string | null;
  peppolStatus?: string | null;
  peppolLastError?: string | null;
  currentTemplate: string;
  defaultTemplate: string;
  docValues: Record<string, string>;
  docRows: DocumentRow[];
}) {
  const router = useRouter();
  const {
    activeAgent,
    isTyping: aiIsTyping,
    open: openAgentChat,
    sendMessage,
  } = useAgentChat();
  const [sendBusy, setSendBusy] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const canMarkSent = !isProforma && status === "concept";
  const canMarkPaid =
    !isProforma && !isPaid && PAYABLE_STATUSES.has(status ?? "");

  async function handleMarkSent() {
    if (sendBusy) return;
    const confirmed = window.confirm(
      `${nummer} markeren als verzonden?\n\nDe status wijzigt van Concept naar Verzonden.`,
    );
    if (!confirmed) return;

    setSendBusy(true);
    setSendError(null);
    setSendSuccess(null);

    const result = await markFactuurAsVerzonden(factuurId);
    if ("error" in result && result.error) {
      setSendError(result.error);
      setSendBusy(false);
      return;
    }

    setSendSuccess(
      "alreadySent" in result && result.alreadySent
        ? "Deze factuur stond al als verzonden."
        : `${nummer} is gemarkeerd als verzonden.`,
    );
    router.refresh();
    setSendBusy(false);
  }

  function openPdf() {
    window.location.href = `/dashboard/facturen/${factuurId}/pdf`;
  }

  function handleAiCheck() {
    openAgentChat();
    sendMessage(
      [
        `Controleer factuur ${nummer} voor ${aiContext.customerLabel}.`,
        "Geef maximaal vijf concrete, zakelijke aandachtspunten. Controleer volledigheid, betaaltermijn, BTW-signalen, openstaand bedrag en een veilige vervolgstap.",
        "Wijzig, verstuur of boek niets. Geef alleen advies dat de gebruiker zelf kan beoordelen.",
        `Documenttype: ${aiContext.isProforma ? "proforma" : "factuur"}`,
        `Status: ${aiContext.statusLabel}`,
        `Factuurdatum: ${aiContext.invoiceDate ?? "ontbreekt"}`,
        `Vervaldatum: ${aiContext.dueDate ?? "ontbreekt"}`,
        `Totaalbedrag: ${formatEuro(aiContext.totalAmount)}`,
        `Openstaand: ${formatEuro(aiContext.openAmount)}`,
        `Aantal regels: ${aiContext.lineCount}`,
        `Ontbrekende gegevens: ${
          aiContext.missingFields.length > 0
            ? aiContext.missingFields.join(", ")
            : "geen gedetecteerd"
        }`,
      ].join("\n"),
    );
  }

  return (
    <aside
      className="flex min-w-0 flex-col gap-3 xl:sticky xl:top-4"
      aria-label="Factuuracties en status"
    >
      <SidebarCard title="Status" className="order-1">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${typeTone}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${typeDot}`} />
              Type: {typeLabel}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusTone}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
              Status: {statusLabel}
            </span>
          </div>
          {isProforma ? (
            <p className="text-xs leading-relaxed text-amber-300/90">
              Proforma geldt niet als officiële factuur.
            </p>
          ) : null}
        </div>
      </SidebarCard>

      <SidebarCard title="Acties" className="order-3">
        <div className="space-y-2">
          {canMarkSent ? (
            <Button
              type="button"
              disabled={sendBusy}
              onClick={() => void handleMarkSent()}
              className="h-10 w-full gap-2 bg-sky-500 text-zinc-950 hover:bg-sky-400"
            >
              {sendBusy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Markeer als verzonden
            </Button>
          ) : null}

          {canMarkPaid ? (
            <MarkFactuurPaidButton
              factuurId={factuurId}
              nummer={nummer}
              variant="compact"
            />
          ) : null}

          {isPaid || (!canMarkSent && !canMarkPaid) ? (
            <Button
              type="button"
              onClick={openPdf}
              className="h-10 w-full gap-2 bg-sky-500 text-zinc-950 hover:bg-sky-400"
            >
              <Download size={16} />
              PDF downloaden
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={openPdf}
              className="h-10 w-full justify-start gap-2 border border-white/[0.08]"
            >
              <Download size={15} />
              PDF downloaden
            </Button>
          )}

          {sendError ? (
            <p className="text-xs text-rose-400" role="alert">
              {sendError}
            </p>
          ) : null}
          {sendSuccess ? (
            <p className="text-xs text-emerald-400" role="status">
              {sendSuccess}
            </p>
          ) : null}

          {status === "concept" && !isProforma ? (
            <p className="text-xs leading-relaxed text-zinc-500">
              Markeer eerst als verzonden voordat je een betaling registreert.
            </p>
          ) : null}
        </div>
      </SidebarCard>

      <SidebarCard title="Betaling" className="order-2">
        {isProforma ? (
          <p className="text-xs text-zinc-500">Niet van toepassing op proforma.</p>
        ) : isPaid ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 size={15} />
              Volledig betaald
            </div>
            {paidAt ? (
              <p className="text-xs text-zinc-400">
                Betaald op {formatDate(paidAt)}
              </p>
            ) : null}
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                Ontvangen
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold text-zinc-50">
                {formatEuro(paidAmount)}
              </p>
            </div>
            {payments.length > 0 ? (
              <ul className="space-y-1.5 border-t border-white/[0.08] pt-2">
                {payments.map((p, i) => (
                  <li key={i} className="text-xs text-zinc-400">
                    <span className="font-mono text-zinc-200">
                      {formatEuro(p.bedrag)}
                    </span>
                    {p.datum ? ` · ${formatDate(p.datum)}` : ""}
                    {p.betaalmethode ? ` · ${p.betaalmethode}` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : canMarkPaid ? (
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                Nog te betalen
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold text-zinc-50">
                {formatEuro(openAmount)}
              </p>
            </div>
            <p className="text-xs text-zinc-500">
              Registreer de betaling via de actie hierboven.
            </p>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            Nog geen betaling mogelijk in deze status.
          </p>
        )}
      </SidebarCard>

      <SidebarCard title="Nova AI" className="order-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
              <Sparkles size={17} aria-hidden="true" />
            </span>
            <p className="text-xs leading-relaxed text-zinc-400">
              Laat {activeAgent.name} deze factuur controleren. De AI geeft alleen
              advies en voert geen acties uit.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            disabled={aiIsTyping}
            onClick={handleAiCheck}
            className="h-10 w-full justify-center gap-2 border border-violet-500/20 bg-violet-500/10 text-violet-200 hover:bg-violet-500/15 hover:text-violet-100"
          >
            {aiIsTyping ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {aiIsTyping ? "Controle loopt…" : "Controleer met AI"}
          </Button>
        </div>
      </SidebarCard>

      <SidebarCard title="PDF en sjabloon" className="order-5">
        <DocumentDownload
          kind="invoice"
          documentId={factuurId}
          currentTemplate={currentTemplate}
          defaultTemplate={defaultTemplate}
          values={docValues}
          rows={docRows}
          variant="compact"
        />
      </SidebarCard>

      {(peppolConnected || peppolStatus) && !isProforma ? (
        <div className="order-6">
          <PeppolActions
            factuurId={factuurId}
            peppolConnected={peppolConnected}
            peppolCanSend={peppolCanSend}
            buyerReference={buyerReference}
            structuredCommunication={structuredCommunication}
            peppolStatus={peppolStatus}
            peppolLastError={peppolLastError}
          />
        </div>
      ) : null}
    </aside>
  );
}
