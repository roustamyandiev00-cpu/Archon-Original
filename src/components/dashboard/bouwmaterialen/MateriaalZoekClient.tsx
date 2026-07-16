"use client";

import { useState, useTransition } from "react";
import { Loader2, Package, FileDown } from "lucide-react";
import GlowCard from "@/components/dashboard/GlowCard";
import {
  addBouwmateriaalPrijs,
  runMateriaalzoekteAgent,
} from "@/app/dashboard/bouwmaterialen/actions";
import type { MateriaalvoorraadHit } from "@/lib/bouwmaterialen/prijzen";
import { btwDisclaimer } from "@/lib/bouwmaterialen/prijzen";

export default function MateriaalZoekClient({
  winkels,
}: {
  winkels: Array<{
    id: number;
    naam: string;
    regio: string | null;
    verificatiestatus: string;
  }>;
}) {
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [regio, setRegio] = useState("");
  const [hits, setHits] = useState<MateriaalvoorraadHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState("");
  const [winkelId, setWinkelId] = useState<number | "">("");
  const [prijs, setPrijs] = useState("");

  function search(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await runMateriaalzoekteAgent({
        query,
        regio: regio || null,
      });
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setHits(res.hits ?? []);
    });
  }

  function addPrice(e: React.FormEvent) {
    e.preventDefault();
    if (!winkelId) return;
    setError(null);
    startTransition(async () => {
      const res = await addBouwmateriaalPrijs({
        winkelId: Number(winkelId),
        productnaam: product,
        prijs: Number(prijs),
        btwStatus: "onbekend",
      });
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setProduct("");
      setPrijs("");
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
          <Package size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">
            Bouwmaterialen zoeken
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Prijzen zonder brondatum worden niet als actueel getoond. BTW-status
            staat altijd expliciet vermeld.
          </p>
        </div>
      </header>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <GlowCard innerClassName="p-4 space-y-3">
        <form onSubmit={search} className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Product (bv. dakpan, tegellijm)"
            className="min-w-[200px] flex-1 rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm"
            required
          />
          <input
            value={regio}
            onChange={(e) => setRegio(e.target.value)}
            placeholder="Regio (optioneel)"
            className="w-40 rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            Zoeken
          </button>
          {hits.length > 0 && (
            <a
              href={`/dashboard/bouwmaterialen/pdf?q=${encodeURIComponent(query)}&regio=${encodeURIComponent(regio)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"
            >
              <FileDown size={13} /> PDF
            </a>
          )}
        </form>

        <ul className="divide-y divide-white/5">
          {hits.length === 0 ? (
            <li className="py-6 text-center text-sm text-zinc-500">
              Geen resultaten — voeg eerst prijzen toe of pas je zoekterm aan.
            </li>
          ) : (
            hits.map((h) => (
              <li key={h.prijsId} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      {h.productnaam}
                      {h.merk ? ` · ${h.merk}` : ""}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {h.winkelNaam}
                      {h.regio ? ` · ${h.regio}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Gecontroleerd{" "}
                      {new Date(h.gecontroleerdOp).toLocaleString("nl-BE")}
                      {h.isStale ? " · verouderd — hercheck aanbevolen" : ""}
                      {h.bronUrl ? ` · ${h.bronUrl}` : ""}
                    </p>
                    <p className="text-[11px] text-amber-300/90">
                      {btwDisclaimer(h.btwStatus)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-100">
                    €{h.prijs.toFixed(2)}/{h.eenheid}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </GlowCard>

      <GlowCard innerClassName="p-4 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-100">Prijs toevoegen</h2>
        <form onSubmit={addPrice} className="grid gap-2 sm:grid-cols-2">
          <select
            value={winkelId}
            onChange={(e) =>
              setWinkelId(e.target.value ? Number(e.target.value) : "")
            }
            className="rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm"
            required
          >
            <option value="">Winkel…</option>
            {winkels.map((w) => (
              <option key={w.id} value={w.id}>
                {w.naam}
                {w.verificatiestatus === "geverifieerd" ? " ✓" : ""}
              </option>
            ))}
          </select>
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Productnaam"
            className="rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm"
            required
          />
          <input
            value={prijs}
            onChange={(e) => setPrijs(e.target.value)}
            placeholder="Prijs (€)"
            type="number"
            step="0.01"
            min="0"
            className="rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-amber-500/90 px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            Opslaan (met brondatum nu)
          </button>
        </form>
      </GlowCard>
    </div>
  );
}
