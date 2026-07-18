"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  Send,
} from "lucide-react";
import { markFactuurAsVerzonden } from "@/app/dashboard/facturen/actions";
import DocumentDownload from "@/components/dashboard/documenten/DocumentDownload";
import PeppolActions from "@/components/dashboard/documenten/PeppolActions";
import MarkFactuurPaidButton from "@/components/dashboard/facturen/MarkFactuurPaidButton";
import { Button } from "@/components/ui/button";
import { formatDate, formatEuro } from "@/lib/offertes";
import type { DocumentRow } from "@/components/dashboard/documenten/documentTemplate";

export type FactuurActivityItem = {
  label: string;
  at: string;
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
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
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
  activity,
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
  activity: FactuurActivityItem[];
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

  return (
    <aside className="flex min-w-0 flex-col gap-3">
      <SidebarCard title="Status">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${typeTone}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${typeDot}`} />
              Type: {typeLabel}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone}`}
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

      <SidebarCard title="Acties">
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

      <SidebarCard title="Betaling">
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
            <div className="flex justify-between text-zinc-300">
              <span>Ontvangen</span>
              <span className="font-mono">{formatEuro(paidAmount)}</span>
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
            <div className="flex justify-between text-zinc-400">
              <span>Openstaand</span>
              <span className="font-mono text-zinc-100">
                {formatEuro(openAmount)}
              </span>
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

      <SidebarCard title="PDF en sjabloon">
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
        <PeppolActions
          factuurId={factuurId}
          peppolConnected={peppolConnected}
          peppolCanSend={peppolCanSend}
          buyerReference={buyerReference}
          structuredCommunication={structuredCommunication}
          peppolStatus={peppolStatus}
          peppolLastError={peppolLastError}
        />
      ) : null}

      {activity.length > 0 ? (
        <SidebarCard title="Activiteit">
          <ul className="space-y-2.5">
            {activity.map((item) => (
              <li key={`${item.label}-${item.at}`} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200">{item.label}</p>
                  <p className="font-mono text-[11px] text-zinc-500">
                    {formatDate(item.at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SidebarCard>
      ) : null}
    </aside>
  );
}

/** Header primary actions for desktop/mobile page chrome */
export function FactuurDetailHeaderActions({
  factuurId,
  nummer,
  status,
  isProforma,
  isPaid,
}: {
  factuurId: number;
  nummer: string;
  status: string | null;
  isProforma: boolean;
  isPaid: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canMarkSent = !isProforma && status === "concept";
  const canMarkPaid =
    !isProforma && !isPaid && PAYABLE_STATUSES.has(status ?? "");

  async function handleMarkSent() {
    if (busy) return;
    const confirmed = window.confirm(
      `${nummer} markeren als verzonden?\n\nDe status wijzigt van Concept naar Verzonden.`,
    );
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    const result = await markFactuurAsVerzonden(factuurId);
    if ("error" in result && result.error) {
      setError(result.error);
      setBusy(false);
      return;
    }
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canMarkSent ? (
        <Button
          type="button"
          disabled={busy}
          onClick={() => void handleMarkSent()}
          className="h-10 gap-2 bg-sky-500 text-zinc-950 hover:bg-sky-400"
        >
          {busy ? (
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
          className="min-w-[11rem]"
        />
      ) : null}

      {!canMarkSent && !canMarkPaid ? (
        <Button
          type="button"
          onClick={() => {
            window.location.href = `/dashboard/facturen/${factuurId}/pdf`;
          }}
          className="h-10 gap-2 bg-sky-500 text-zinc-950 hover:bg-sky-400"
        >
          <Download size={16} />
          PDF downloaden
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            window.location.href = `/dashboard/facturen/${factuurId}/pdf`;
          }}
          className="h-10 gap-2 border border-white/[0.08]"
          aria-label="PDF downloaden"
        >
          <Eye size={16} />
          <span className="hidden sm:inline">Voorbeeld PDF</span>
        </Button>
      )}

      {error ? (
        <p className="w-full text-right text-xs text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
