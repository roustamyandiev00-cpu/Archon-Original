"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Download, Loader2, RefreshCw } from "lucide-react";
import { formatEuro, formatDate } from "@/lib/offertes";
import {
  confirmPeppolInboxItemAction,
  setPeppolAutoSyncAction,
  syncPeppolInboxAction,
} from "@/app/dashboard/e-facturen/actions";
import { StatusPill } from "@/components/dashboard/finance/FinanceHub";
import type { PeppolInboxRow } from "@/lib/peppol/inbox";

function inboxDocLabel(type: string) {
  if (type === "creditnote") return "Creditnota";
  if (type === "imr") return "IMR (feedback)";
  if (type === "mlr") return "MLR (fout)";
  return "Leveranciersfactuur";
}

function inboxStatusTone(status: string): "ok" | "warn" | "neutral" {
  if (status === "verwerkt") return "ok";
  if (status === "fout") return "warn";
  return "neutral";
}

export default function PeppolInboxPanel({
  items,
  canSync,
  autoSyncEnabled = false,
  lastSyncAt,
}: {
  items: PeppolInboxRow[];
  canSync: boolean;
  autoSyncEnabled?: boolean;
  lastSyncAt?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleAutoSync() {
    startTransition(async () => {
      const res = await setPeppolAutoSyncAction(!autoSyncEnabled);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function runSync() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await syncPeppolInboxAction();
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setMessage(res.message ?? "Inbox gesynchroniseerd.");
      router.refresh();
    });
  }

  function runConfirm(id: number) {
    setConfirmingId(id);
    setError(null);
    startTransition(async () => {
      const res = await confirmPeppolInboxItemAction(id);
      setConfirmingId(null);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Ontvangen inbox
          </h2>
          <p className="text-xs text-zinc-500">
            Leveranciersfacturen via Peppol (Billit access point)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={autoSyncEnabled}
              onChange={toggleAutoSync}
              disabled={!canSync || pending}
              className="rounded border-white/20 bg-zinc-900"
            />
            Auto-sync elk uur
          </label>
          <button
            type="button"
            onClick={runSync}
            disabled={!canSync || pending}
            className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3.5 py-1.5 text-xs font-medium text-orange-300 transition-colors hover:bg-orange-500/15 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
            Inbox ophalen
          </button>
        </div>
      </div>

      <div className="p-5">
        {lastSyncAt && (
          <p className="mb-3 text-[11px] text-zinc-600">
            Laatste sync: {formatDate(lastSyncAt.slice(0, 10))}{" "}
            {lastSyncAt.slice(11, 16)}
          </p>
        )}
        {!canSync && (
          <p className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-sm text-amber-200/90">
            Koppel Billit als Peppol access point om inkomende e-facturen op te
            halen.
          </p>
        )}

        {message && (
          <p className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-sm text-emerald-300">
            {message}
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.05] px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        )}

        {items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-zinc-400">Nog geen inkomende documenten</p>
            <p className="mt-1 text-xs text-zinc-600">
              Klik op &quot;Inbox ophalen&quot; om nieuwe Peppol-facturen van
              leveranciers te importeren.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-zinc-100">
                      {item.invoice_number ??
                        `${inboxDocLabel(item.document_type)} #${item.external_inbox_item_id}`}
                    </p>
                    <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                      {inboxDocLabel(item.document_type)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {[
                      item.supplier_name,
                      item.sender_peppol_id,
                      item.received_at
                        ? formatDate(item.received_at.slice(0, 10))
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {item.total_amount != null && (
                    <p className="text-sm font-medium tabular-nums text-zinc-200">
                      {formatEuro(item.total_amount)}
                    </p>
                  )}
                  <StatusPill
                    label={
                      item.status === "verwerkt" ? "Verwerkt" : "Nieuw"
                    }
                    tone={inboxStatusTone(item.status)}
                  />
                  {item.peppol_file_id && (
                    <a
                      href={`/dashboard/e-facturen/inbox/${item.id}/ubl`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-orange-500/25 hover:text-orange-300"
                      title="UBL downloaden"
                    >
                      <Download size={14} />
                    </a>
                  )}
                  {item.status !== "verwerkt" && (
                    <button
                      type="button"
                      onClick={() => runConfirm(item.id)}
                      disabled={confirmingId === item.id || pending}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-emerald-500/25 hover:text-emerald-300 disabled:opacity-50"
                    >
                      {confirmingId === item.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      Bevestigen
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
