"use client";

import { useState, useTransition } from "react";
import { Check, Download, Loader2, Radio } from "lucide-react";
import { sendFactuurViaPeppol } from "@/app/dashboard/facturen/peppolActions";

export default function PeppolActions({
  factuurId,
  peppolConnected,
}: {
  factuurId: number;
  peppolConnected: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function send() {
    setMsg(null);
    startTransition(async () => {
      const res = await sendFactuurViaPeppol(factuurId);
      if (res && "error" in res && res.error) {
        setMsg({ ok: false, text: res.error });
        return;
      }
      setMsg({ ok: true, text: "Verstuurd via Peppol." });
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
        <Radio size={15} className="text-sky-400" />
        Peppol e-facturatie
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500">
        Download de e-factuur als UBL (BIS 3.0) of verstuur ze rechtstreeks via
        het Peppol-netwerk.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={`/dashboard/facturen/${factuurId}/peppol`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
        >
          <Download size={15} /> Download UBL (e-factuur)
        </a>
        <button
          type="button"
          onClick={send}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Versturen…
            </>
          ) : (
            <>
              <Radio size={15} /> Verstuur via Peppol
            </>
          )}
        </button>
      </div>

      {!peppolConnected && (
        <p className="mt-3 text-xs text-amber-300/90">
          Peppol is nog niet verbonden. De UBL-download werkt altijd; voor
          rechtstreeks versturen koppel je eerst een access point via{" "}
          <a href="/dashboard/integraties" className="underline hover:text-amber-200">
            Integraties
          </a>
          .
        </p>
      )}

      {msg && (
        <p
          className={`mt-3 inline-flex items-center gap-1.5 text-xs ${
            msg.ok ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {msg.ok && <Check size={13} />} {msg.text}
        </p>
      )}
    </div>
  );
}
