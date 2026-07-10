"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Building2, Loader2, Send } from "lucide-react";
import { formatEuro, formatDate } from "@/lib/offertes";
import { sendFactuurViaMercurius } from "@/app/dashboard/facturen/peppolActions";
import { MERCURIUS_HINTS } from "@/lib/peppol/mercurius";
import { StatusPill } from "@/components/dashboard/finance/FinanceHub";

type MercuriusFactuur = {
  id: number;
  nummer: string | null;
  klant: string | null;
  totaal_bedrag: number | null;
  datum: string | null;
  buyer_reference: string | null;
  mercurius_status: string | null;
  mercurius_last_error: string | null;
};

export default function MercuriusPanel({
  facturen,
  peppolConnected,
}: {
  facturen: MercuriusFactuur[];
  peppolConnected: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function runSend(id: number) {
    setSendingId(id);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await sendFactuurViaMercurius(id);
      setSendingId(null);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setMessage("Factuur verstuurd via Mercurius/Peppol B2G.");
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/60">
      <div className="flex items-start gap-3 border-b border-white/[0.06] px-5 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
          <Building2 size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Mercurius (overheid)</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            B2G-facturen naar Belgische overheid via Peppol-netwerk
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <ul className="space-y-1.5 text-xs text-zinc-500">
          {MERCURIUS_HINTS.slice(0, 3).map((hint) => (
            <li key={hint}>• {hint}</li>
          ))}
        </ul>

        {!peppolConnected && (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-sm text-amber-200/90">
            Koppel eerst Peppol in{" "}
            <Link href="/dashboard/integraties" className="text-orange-300 hover:text-orange-200">
              Integraties
            </Link>
            .
          </p>
        )}

        {message && (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-sm text-emerald-300">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-rose-500/20 bg-rose-500/[0.05] px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        )}

        {facturen.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Geen overheidsfacturen. Markeer een klant als &quot;Overheidsklant&quot; in{" "}
            <Link href="/dashboard/contacten" className="text-orange-400 hover:text-orange-300">
              Contacten
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.06]">
            {facturen.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-100">
                    {f.nummer ?? `#${f.id}`}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {[f.klant, f.buyer_reference, f.datum ? formatDate(f.datum) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {f.mercurius_last_error && (
                    <p className="mt-0.5 text-[11px] text-rose-400">{f.mercurius_last_error}</p>
                  )}
                </div>
                <p className="text-sm font-medium text-zinc-200">
                  {formatEuro(f.totaal_bedrag ?? 0)}
                </p>
                <StatusPill
                  label={
                    f.mercurius_status === "verzonden"
                      ? "Verzonden"
                      : "Te versturen"
                  }
                  tone={f.mercurius_status === "verzonden" ? "ok" : "neutral"}
                />
                {f.mercurius_status !== "verzonden" && (
                  <button
                    type="button"
                    onClick={() => runSend(f.id)}
                    disabled={!peppolConnected || pending}
                    className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/15 disabled:opacity-50"
                  >
                    {sendingId === f.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    Verstuur B2G
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
