"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, Plus, Tags, X } from "lucide-react";
import {
  createPrijslijstItem,
  setPrijslijstItemActive,
  updatePrijslijstItem,
} from "@/app/dashboard/prijslijst/actions";

export type PrijslijstItem = {
  id: number;
  omschrijving: string;
  eenheid: string;
  prijs: number;
  btwPercentage: number;
  categorie: string | null;
  isActive: boolean;
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-sky-500/60";

function euro(value: number) {
  return value.toLocaleString("nl-BE", {
    style: "currency",
    currency: "EUR",
  });
}

export const EENHEID_OPTIONS = [
  { value: "m²", label: "Vierkante meter (m²)" },
  { value: "l.m.", label: "Lopende meter (l.m.)" },
  { value: "per uur", label: "Per uur" },
  { value: "forfait", label: "Forfaitprijs" },
  { value: "stuks", label: "Per stuk" },
] as const;

const emptyForm = {
  omschrijving: "",
  eenheid: "m²",
  prijs: "",
  btwPercentage: "21",
  categorie: "",
};

export default function PrijslijstManager({ items }: { items: PrijslijstItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (!showInactive && !item.isActive) return false;
      if (!q) return true;
      return (
        item.omschrijving.toLowerCase().includes(q) ||
        (item.categorie ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, query, showInactive]);

  function close() {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item: PrijslijstItem) {
    setEditingId(item.id);
    setForm({
      omschrijving: item.omschrijving,
      eenheid: item.eenheid,
      prijs: String(item.prijs),
      btwPercentage: String(item.btwPercentage),
      categorie: item.categorie ?? "",
    });
    setOpen(true);
  }

  function submit() {
    setError(null);
    setSuccess(null);
    const payload = {
      omschrijving: form.omschrijving,
      eenheid: form.eenheid,
      prijs: Number(form.prijs.replace(",", ".")),
      btwPercentage: Number(form.btwPercentage.replace(",", ".")),
      categorie: form.categorie,
    };

    startTransition(async () => {
      const result = editingId
        ? await updatePrijslijstItem(editingId, payload)
        : await createPrijslijstItem(payload);
      if ("error" in result) {
        setError(result.error ?? "Opslaan mislukt.");
        return;
      }
      setSuccess(editingId ? "Artikel bijgewerkt." : "Artikel toegevoegd.");
      close();
      router.refresh();
    });
  }

  function toggleActive(item: PrijslijstItem) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await setPrijslijstItemActive(item.id, !item.isActive);
      if ("error" in result) {
        setError(result.error ?? "Status wijzigen mislukt.");
        return;
      }
      setSuccess(item.isActive ? "Artikel gedeactiveerd." : "Artikel geactiveerd.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op omschrijving of categorie…"
          className={`${inputClass} max-w-md`}
        />
        <label className="inline-flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-white/20"
          />
          Toon inactief
        </label>
        <button
          type="button"
          onClick={openCreate}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-sky-400"
        >
          <Plus size={16} />
          Nieuw artikel
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          <Check size={16} />
          {success}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/40 px-4 py-12 text-center text-sm text-zinc-500">
          Nog geen prijslijstartikelen. Voeg standaardwerken of materialen toe.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50">
          <div className="divide-y divide-white/10">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-5"
              >
                <div className="min-w-0 flex-1 basis-52">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-zinc-100">
                      {item.omschrijving}
                    </p>
                    <span className="shrink-0 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                      {item.eenheid}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {item.categorie || "Algemeen"}
                    {!item.isActive ? " · inactief" : ""}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold text-zinc-100">
                  {euro(item.prijs)}
                  <span className="font-sans font-normal text-zinc-500">
                    {" "}
                    / {item.eenheid}
                  </span>
                </p>
                <p className="shrink-0 text-sm text-zinc-400">
                  {item.btwPercentage}% btw
                </p>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => openEdit(item)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-50"
                  >
                    Bewerken
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggleActive(item)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-50"
                  >
                    {item.isActive ? "Deactiveren" : "Activeren"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tags size={18} className="text-sky-400" />
                <h2 className="text-lg font-semibold text-zinc-100">
                  {editingId ? "Artikel bewerken" : "Nieuw artikel"}
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm text-zinc-300">
                  Omschrijving
                </label>
                <input
                  className={inputClass}
                  value={form.omschrijving}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, omschrijving: e.target.value }))
                  }
                  placeholder="bv. Plaatsen gipskarton m²"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">
                    Eenheid
                  </label>
                  <select
                    className={inputClass}
                    value={form.eenheid}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, eenheid: e.target.value }))
                    }
                  >
                    {EENHEID_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    {!EENHEID_OPTIONS.some(
                      (option) => option.value === form.eenheid,
                    ) && <option value={form.eenheid}>{form.eenheid}</option>}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">
                    Prijs (€)
                  </label>
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={form.prijs}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, prijs: e.target.value }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">
                    BTW %
                  </label>
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={form.btwPercentage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, btwPercentage: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">
                    Categorie
                  </label>
                  <input
                    className={inputClass}
                    value={form.categorie}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, categorie: e.target.value }))
                    }
                    placeholder="Optioneel"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Annuleren
              </button>
              <button
                type="button"
                disabled={pending || !form.omschrijving.trim()}
                onClick={submit}
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-50"
              >
                {pending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
