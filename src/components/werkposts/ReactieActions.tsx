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
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          onClick={accept}
          disabled={busy !== null}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/25 disabled:opacity-60"
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
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500/25 disabled:opacity-60"
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
            href="/dashboard/werkposts/samenwerkingen"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/15 hover:text-sky-200"
          >
            <MessageCircle size={13} /> Ga naar chat
          </Link>
        )}
      </div>
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}
