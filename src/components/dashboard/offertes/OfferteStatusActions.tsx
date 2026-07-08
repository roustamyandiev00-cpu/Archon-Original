"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, XCircle, Trash2, Loader2 } from "lucide-react";
import {
  updateOfferteStatus,
  deleteOfferte,
} from "@/app/dashboard/offertes/actions";
import type { OfferteStatus } from "@/lib/offertes";

export default function OfferteStatusActions({
  id,
  status,
}: {
  id: number;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(next: OfferteStatus, key: string) {
    setBusy(key);
    await updateOfferteStatus(id, next);
    setBusy(null);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Deze offerte definitief verwijderen?")) return;
    setBusy("delete");
    await deleteOfferte(id);
    router.push("/dashboard/offertes");
    router.refresh();
  }

  const isOpen = ["verzonden", "bekeken"].includes(status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "concept" && (
        <button
          onClick={() => setStatus("verzonden", "send")}
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
  );
}
