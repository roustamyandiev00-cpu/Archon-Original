"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  FileText,
} from "lucide-react";
import {
  updateOfferteStatus,
  deleteOfferte,
} from "@/app/dashboard/offertes/actions";
import { convertOfferteToFactuur } from "@/app/dashboard/offertes/convert-actions";
import type { OfferteStatus } from "@/lib/offertes";
import SendOfferteModal from "@/components/dashboard/offertes/SendOfferteModal";

export default function OfferteStatusActions({
  id,
  status,
}: {
  id: number;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: OfferteStatus, key: string) {
    setBusy(key);
    setError(null);
    const result = await updateOfferteStatus(id, next);
    setBusy(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if (
      next === "geaccepteerd" &&
      "projectId" in result &&
      typeof result.projectId === "string"
    ) {
      router.push(`/dashboard/offertes/projecten/${result.projectId}`);
      router.refresh();
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!confirm("Deze offerte definitief verwijderen?")) return;
    setBusy("delete");
    setError(null);
    const result = await deleteOfferte(id);
    setBusy(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard/offertes");
    router.refresh();
  }

  async function makeInvoice() {
    setBusy("invoice");
    setError(null);
    const result = await convertOfferteToFactuur(id);
    setBusy(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if ("id" in result && result.id) {
      router.push(`/dashboard/facturen/${result.id}`);
      router.refresh();
    }
  }

  const isOpen = ["verzonden", "bekeken"].includes(status);

  return (
    <>
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {status === "concept" && (
          <button
            onClick={() => setSendOpen(true)}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:opacity-60"
          >
            {busy === "send" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            Verzenden
          </button>
        )}

        {isOpen && (
          <>
            <button
              onClick={() => setStatus("geaccepteerd", "accept")}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:opacity-60"
            >
              {busy === "accept" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              Geaccepteerd
            </button>
            <button
              onClick={() => setStatus("afgewezen", "reject")}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/25 disabled:opacity-60"
            >
              {busy === "reject" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <XCircle size={15} />
              )}
              Afwijzen
            </button>
          </>
        )}

        {status === "geaccepteerd" && (
          <button
            onClick={makeInvoice}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-full bg-teal-500/15 px-4 py-2 text-sm font-medium text-teal-300 transition-colors hover:bg-teal-500/25 disabled:opacity-60"
          >
            {busy === "invoice" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileText size={15} />
            )}
            Factuur maken
          </button>
        )}

        <button
          onClick={remove}
          disabled={busy !== null}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-rose-500/40 hover:text-rose-400 disabled:opacity-60"
        >
          {busy === "delete" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
          Verwijderen
        </button>
      </div>

      <SendOfferteModal
        offerteId={id}
        open={sendOpen}
        onClose={() => {
          setSendOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
