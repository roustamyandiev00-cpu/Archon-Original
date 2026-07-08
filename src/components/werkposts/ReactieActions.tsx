"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, MessageCircle } from "lucide-react";
import { acceptReactie, rejectReactie } from "@/app/dashboard/werkposts/actions";

export default function ReactieActions({ reactieId }: { reactieId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);

  async function accept() {
    setBusy("accept");
    setError(null);
    const res = await acceptReactie(reactieId);
    setBusy(null);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("channelId" in res && res.channelId) setChannelId(res.channelId);
    router.refresh();
  }

  async function reject() {
    setBusy("reject");
    setError(null);
    const res = await rejectReactie(reactieId);
    setBusy(null);
    if ("error" in res && res.error) setError(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={accept}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:opacity-60"
        >
          {busy === "accept" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <CheckCircle2 size={13} />
          )}
          Accepteren
        </button>
        <button
          onClick={reject}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3.5 py-1.5 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/25 disabled:opacity-60"
        >
          {busy === "reject" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <XCircle size={13} />
          )}
          Afwijzen
        </button>
        {channelId && (
          <Link
            href="/dashboard/comms"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300"
          >
            <MessageCircle size={13} /> Ga naar chat
          </Link>
        )}
      </div>
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}
