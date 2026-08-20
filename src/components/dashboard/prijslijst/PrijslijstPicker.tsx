"use client";

import { useMemo, useState } from "react";
import { Search, Tags } from "lucide-react";
import type { PrijslijstPickItem } from "@/components/dashboard/prijslijst/types";
import { formatEuro } from "@/lib/offertes";

export default function PrijslijstPicker({
  items,
  onPick,
  variant = "dark",
}: {
  items: PrijslijstPickItem[];
  onPick: (item: PrijslijstPickItem) => void;
  variant?: "dark" | "light";
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const light = variant === "light";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 12);
    return items
      .filter(
        (item) =>
          item.omschrijving.toLowerCase().includes(q) ||
          (item.categorie ?? "").toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [items, query]);

  if (items.length === 0) {
    return (
      <p
        className={
          light
            ? "rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] text-zinc-500"
            : "rounded-xl border border-dashed border-white/10 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-500"
        }
      >
        Geen prijslijst.{" "}
        <a
          href="/dashboard/prijslijst"
          className={light ? "text-sky-600 hover:underline" : "text-sky-400 hover:underline"}
        >
          Artikelen toevoegen
        </a>
      </p>
    );
  }

  return (
    <div
      className={
        light
          ? "rounded-lg border border-zinc-200 bg-zinc-50 p-3"
          : "rounded-xl border border-white/10 bg-zinc-950/40 p-3"
      }
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center justify-between gap-2 text-left"
      >
        <span
          className={
            light
              ? "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500"
              : "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400"
          }
        >
          <Tags size={13} className={light ? "text-sky-600" : "text-sky-400"} />
          Uit prijslijst toevoegen
        </span>
        <span className="text-xs text-zinc-500">
          {open ? "Sluiten" : `${items.length} artikelen`}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek artikel…"
              className={
                light
                  ? "w-full rounded-lg border border-zinc-200 bg-white py-2 pl-8 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-sky-400"
                  : "w-full rounded-lg border border-white/10 bg-zinc-900/80 py-2 pl-8 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-sky-500/50"
              }
            />
          </div>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-1 py-2 text-xs text-zinc-500">Geen treffers.</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onPick(item);
                    setQuery("");
                  }}
                  className={
                    light
                      ? "flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors hover:border-sky-200 hover:bg-sky-50"
                      : "flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors hover:border-sky-500/30 hover:bg-sky-500/10"
                  }
                >
                  <span className="min-w-0">
                    <span
                      className={
                        light
                          ? "block truncate text-sm text-zinc-900"
                          : "block truncate text-sm text-zinc-100"
                      }
                    >
                      {item.omschrijving}
                    </span>
                    <span className="block text-[11px] text-zinc-500">
                      {item.categorie || "Algemeen"} · {item.eenheid} · BTW{" "}
                      {item.btwPercentage}%
                    </span>
                  </span>
                  <span
                    className={
                      light
                        ? "shrink-0 font-mono text-xs text-sky-700"
                        : "shrink-0 font-mono text-xs text-sky-300"
                    }
                  >
                    {formatEuro(item.prijs)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
