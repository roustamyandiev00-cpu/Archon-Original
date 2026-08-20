"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Handshake, Loader2, Star, Trash2 } from "lucide-react";
import GlowCard from "@/components/dashboard/GlowCard";
import {
  deleteBedrijfConnectie,
  saveOnderaannemerAgentSettings,
  upsertBedrijfConnectie,
  type ConnectieStatus,
} from "@/app/dashboard/bouwnetwerk/partners-actions";
import { REGIOS } from "@/lib/werkposts";

const STATUS_OPTIONS: { value: ConnectieStatus; label: string }[] = [
  { value: "favoriet", label: "Favoriet" },
  { value: "eerder_samengewerkt", label: "Eerder samengewerkt" },
  { value: "vaste_partner", label: "Vaste partner" },
];

export default function PartnersClient({
  partners,
  directory,
  score,
  settings: initialSettings,
}: {
  partners: Array<{
    id: string;
    connectieBedrijfId: number;
    naam: string;
    status: string;
    notities: string | null;
    createdAt: string;
  }>;
  directory: Array<{ id: number; naam: string }>;
  score: number;
  settings: {
    enabled: boolean;
    regio: string[];
    typeWerk: string[];
    beschikbaar: boolean;
    minimumUurtarief: number | null;
    maxBerichtenPerDag: number;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<number | "">("");
  const [status, setStatus] = useState<ConnectieStatus>("favoriet");
  const [notes, setNotes] = useState("");
  const [matchEnabled, setMatchEnabled] = useState(initialSettings.enabled);
  const [regio, setRegio] = useState(initialSettings.regio.join(", "));
  const [typeWerk, setTypeWerk] = useState(initialSettings.typeWerk.join(", "));

  function addPartner(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerId) return;
    setError(null);
    startTransition(async () => {
      const res = await upsertBedrijfConnectie({
        connectieBedrijfId: Number(partnerId),
        status,
        notities: notes,
      });
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setPartnerId("");
      setNotes("");
      router.refresh();
    });
  }

  function saveMatching(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveOnderaannemerAgentSettings({
        enabled: matchEnabled,
        regio: regio
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        typeWerk: typeWerk
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        beschikbaar: true,
        minimumUurtarief: initialSettings.minimumUurtarief,
        maxBerichtenPerDag: initialSettings.maxBerichtenPerDag,
      });
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
          <Handshake size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">
            Zakelijke partners
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Favorieten, eerdere samenwerkingen en matching-voorstellen (geen
            auto-send).
          </p>
        </div>
      </header>

      <GlowCard innerClassName="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Betrouwbaarheidsscore
            </p>
            <p className="mt-1 text-3xl font-semibold text-zinc-50">{score}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Server-side berekend · alleen het resultaat wordt getoond
            </p>
          </div>
          <Star className="text-amber-400" size={28} />
        </div>
      </GlowCard>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <GlowCard innerClassName="p-4 sm:p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-100">Partner toevoegen</h2>
        <form onSubmit={addPartner} className="grid gap-3 sm:grid-cols-2">
          <select
            value={partnerId}
            onChange={(e) =>
              setPartnerId(e.target.value ? Number(e.target.value) : "")
            }
            className="rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
            required
          >
            <option value="">Kies bedrijf…</option>
            {directory.map((d) => (
              <option key={d.id} value={d.id}>
                {d.naam}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ConnectieStatus)}
            className="rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Privé-notities (alleen jij ziet dit)"
            className="sm:col-span-2 rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
          />
          <button
            type="submit"
            disabled={pending}
            className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            Opslaan
          </button>
        </form>

        <ul className="divide-y divide-white/5">
          {partners.length === 0 ? (
            <li className="py-6 text-center text-sm text-zinc-500">
              Nog geen partners.
            </li>
          ) : (
            partners.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-100">{p.naam}</p>
                  <p className="text-xs text-zinc-500">
                    {STATUS_OPTIONS.find((s) => s.value === p.status)?.label ??
                      p.status}
                    {p.notities ? ` · ${p.notities}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteBedrijfConnectie(p.id);
                      router.refresh();
                    })
                  }
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-rose-300"
                  title="Verwijderen"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))
          )}
        </ul>
      </GlowCard>

      <GlowCard innerClassName="p-4 sm:p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Opdracht-matching (voorstellen)
        </h2>
        <p className="text-xs text-zinc-500">
          Nova stelt passende open werkposts voor ter goedkeuring. Er wordt
          nooit automatisch een reactie verstuurd.
        </p>
        <form onSubmit={saveMatching} className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={matchEnabled}
              onChange={(e) => setMatchEnabled(e.target.checked)}
            />
            Matching inschakelen
          </label>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">
              Regio&apos;s (komma-gescheiden) — bv. {REGIOS.slice(0, 3).join(", ")}
            </label>
            <input
              value={regio}
              onChange={(e) => setRegio(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">
              Type werk (komma-gescheiden)
            </label>
            <input
              value={typeWerk}
              onChange={(e) => setTypeWerk(e.target.value)}
              placeholder="bv. pleisterwerk, dakwerken"
              className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            Matching opslaan
          </button>
        </form>
      </GlowCard>
    </div>
  );
}
