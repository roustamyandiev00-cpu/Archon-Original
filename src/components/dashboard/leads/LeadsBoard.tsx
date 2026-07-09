"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Euro, GripVertical, Plus, Trash2, X } from "lucide-react";
import {
  createDeal,
  deleteDeal,
  moveDeal,
} from "@/app/dashboard/leads/actions";
import { STADIA, STAGE_STYLES, type Stadium } from "./stages";

export type DealCard = {
  id: number;
  titel: string;
  stadium: string;
  waarde: number | null;
  kans: number | null;
  deadline: string | null;
};

const euro = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function normalizeStadium(value: string): Stadium {
  return (STADIA as readonly string[]).includes(value)
    ? (value as Stadium)
    : "Lead";
}

export default function LeadsBoard({ initialDeals }: { initialDeals: DealCard[] }) {
  const [deals, setDeals] = useState<DealCard[]>(initialDeals);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<Stadium | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const byStage = useMemo(() => {
    const map = new Map<Stadium, DealCard[]>();
    for (const s of STADIA) map.set(s, []);
    for (const d of deals) map.get(normalizeStadium(d.stadium))!.push(d);
    return map;
  }, [deals]);

  function handleDrop(stadium: Stadium) {
    setDragOver(null);
    const id = draggingId;
    setDraggingId(null);
    if (id == null) return;

    const current = deals.find((d) => d.id === id);
    if (!current || normalizeStadium(current.stadium) === stadium) return;

    const previous = current.stadium;
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stadium } : d)),
    );
    setError(null);

    startTransition(async () => {
      const res = await moveDeal(id, stadium);
      if ("error" in res && res.error) {
        setError(res.error);
        setDeals((prev) =>
          prev.map((d) => (d.id === id ? { ...d, stadium: previous } : d)),
        );
      }
    });
  }

  function handleDelete(id: number) {
    const snapshot = deals;
    setDeals((prev) => prev.filter((d) => d.id !== id));
    startTransition(async () => {
      const res = await deleteDeal(id);
      if ("error" in res && res.error) {
        setError(res.error);
        setDeals(snapshot);
      }
    });
  }

  function handleCreate(stadium: Stadium, titel: string, waarde: number | null) {
    const tempId = -Date.now();
    const optimistic: DealCard = {
      id: tempId,
      titel,
      stadium,
      waarde,
      kans: null,
      deadline: null,
    };
    setDeals((prev) => [...prev, optimistic]);
    setError(null);

    startTransition(async () => {
      const res = await createDeal({ titel, stadium, waarde, kans: null });
      if ("error" in res && res.error) {
        setError(res.error);
        setDeals((prev) => prev.filter((d) => d.id !== tempId));
        return;
      }
      if ("id" in res) {
        setDeals((prev) =>
          prev.map((d) => (d.id === tempId ? { ...d, id: res.id ?? d.id } : d)),
        );
      }
    });
  }

  const totalValue = deals.reduce((sum, d) => sum + (d.waarde ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
            Leads / CRM
          </h1>
          <p className="text-sm text-zinc-400">
            Sleep kaarten tussen de stadia om je verkooppijplijn bij te werken.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300">
          Pijplijn:{" "}
          <span className="font-semibold text-zinc-100">
            {euro.format(totalValue)}
          </span>{" "}
          · {deals.length} deals
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STADIA.map((stadium) => {
          const cards = byStage.get(stadium) ?? [];
          const style = STAGE_STYLES[stadium];
          const columnValue = cards.reduce(
            (sum, d) => sum + (d.waarde ?? 0),
            0,
          );
          return (
            <div
              key={stadium}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOver !== stadium) setDragOver(stadium);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOver((cur) => (cur === stadium ? null : cur));
                }
              }}
              onDrop={() => handleDrop(stadium)}
              className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-zinc-900/40 transition-colors ${
                dragOver === stadium
                  ? `border-transparent ring-2 ${style.ring} bg-zinc-900/70`
                  : "border-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  <span className="text-sm font-medium text-zinc-200">
                    {stadium}
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                    {cards.length}
                  </span>
                </div>
                {columnValue > 0 && (
                  <span className="text-xs text-zinc-500">
                    {euro.format(columnValue)}
                  </span>
                )}
              </div>

              <div className="flex min-h-24 flex-1 flex-col gap-2 p-3">
                {cards.map((deal) => (
                  <article
                    key={deal.id}
                    draggable
                    onDragStart={() => setDraggingId(deal.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOver(null);
                    }}
                    className={`group cursor-grab rounded-xl border border-white/10 bg-zinc-800/60 p-3 shadow-sm transition-all hover:border-white/20 active:cursor-grabbing ${
                      draggingId === deal.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical
                        size={14}
                        className="mt-0.5 shrink-0 text-zinc-600"
                      />
                      <p className="flex-1 text-sm font-medium leading-snug text-zinc-100">
                        {deal.titel}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDelete(deal.id)}
                        aria-label="Verwijder deal"
                        className="shrink-0 rounded-md p-1 text-zinc-600 opacity-0 transition hover:bg-white/5 hover:text-rose-300 group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {(deal.waarde != null || deal.kans != null) && (
                      <div className="mt-2 flex items-center gap-2 pl-6">
                        {deal.waarde != null && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium ${style.text}`}
                          >
                            <Euro size={11} />
                            {euro.format(deal.waarde).replace("€", "").trim()}
                          </span>
                        )}
                        {deal.kans != null && (
                          <span className="text-xs text-zinc-500">
                            {deal.kans}% kans
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                ))}

                <AddCard
                  onAdd={(titel, waarde) =>
                    handleCreate(stadium, titel, waarde)
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddCard({
  onAdd,
}: {
  onAdd: (titel: string, waarde: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [titel, setTitel] = useState("");
  const [waarde, setWaarde] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const t = titel.trim();
    if (!t) {
      setOpen(false);
      return;
    }
    const parsed = waarde.trim() ? Number(waarde.replace(/[^\d.,]/g, "").replace(",", ".")) : null;
    onAdd(t, parsed != null && !Number.isNaN(parsed) ? parsed : null);
    setTitel("");
    setWaarde("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex items-center gap-1.5 rounded-xl border border-dashed border-white/10 px-3 py-2 text-sm text-zinc-500 transition hover:border-white/20 hover:text-zinc-300"
      >
        <Plus size={14} /> Deal toevoegen
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/15 bg-zinc-800/60 p-2">
      <input
        ref={inputRef}
        value={titel}
        onChange={(e) => setTitel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Titel van de deal"
        className="w-full rounded-lg bg-transparent px-1.5 py-1 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
      />
      <div className="mt-1 flex items-center gap-2">
        <input
          value={waarde}
          onChange={(e) => setWaarde(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Waarde (€)"
          inputMode="decimal"
          className="w-24 rounded-lg bg-zinc-900/60 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-sky-400"
        >
          Toevoegen
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Annuleren"
          className="rounded-lg p-1 text-zinc-500 transition hover:text-zinc-300"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
