"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  CircleCheck,
  Loader2,
  Package,
  PackagePlus,
  Plus,
  RotateCcw,
  Search,
  Tags,
  X,
} from "lucide-react";
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

const emptyForm = {
  omschrijving: "",
  eenheid: "stuks",
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
  const [category, setCategory] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const activeCount = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items],
  );
  const categories = useMemo(
    () =>
      [...new Set(items.map((item) => item.categorie || "Algemeen"))].sort(
        (a, b) => a.localeCompare(b, "nl"),
      ),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (!showInactive && !item.isActive) return false;
      if (category && (item.categorie || "Algemeen") !== category) return false;
      if (!q) return true;
      return (
        item.omschrijving.toLowerCase().includes(q) ||
        item.eenheid.toLowerCase().includes(q) ||
        (item.categorie ?? "").toLowerCase().includes(q)
      );
    });
  }, [category, items, query, showInactive]);

  const hasFilters = Boolean(query || category || showInactive);

  function resetFilters() {
    setQuery("");
    setCategory("");
    setShowInactive(false);
  }

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || pending) return;
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setError(null);
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, pending]);

  function close() {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setSuccess(null);
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
    setError(null);
    setSuccess(null);
    setOpen(true);
  }

  function submit() {
    setError(null);
    setSuccess(null);
    const normalizedPrice = form.prijs.trim().replace(",", ".");
    const normalizedVat = form.btwPercentage.trim().replace(",", ".");
    const price = Number(normalizedPrice);
    const vatPercentage = Number(normalizedVat);

    if (!form.omschrijving.trim()) {
      setError("Vul een omschrijving in.");
      return;
    }
    if (!normalizedPrice || !Number.isFinite(price) || price < 0) {
      setError("Vul een geldige prijs van nul euro of meer in.");
      return;
    }
    if (!Number.isFinite(vatPercentage) || vatPercentage < 0 || vatPercentage > 100) {
      setError("Vul een btw-tarief tussen 0 en 100% in.");
      return;
    }

    const payload = {
      omschrijving: form.omschrijving,
      eenheid: form.eenheid,
      prijs: price,
      btwPercentage: vatPercentage,
      categorie: form.categorie,
    };

    startTransition(async () => {
      try {
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
      } catch {
        setError(
          "Opslaan is niet gelukt door een verbindingsprobleem. Probeer het opnieuw.",
        );
      }
    });
  }

  function toggleActive(item: PrijslijstItem) {
    if (item.isActive && !confirm(`Artikel \"${item.omschrijving}\" deactiveren?`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await setPrijslijstItemActive(item.id, !item.isActive);
        if ("error" in result) {
          setError(result.error ?? "Status wijzigen mislukt.");
          return;
        }
        setSuccess(item.isActive ? "Artikel gedeactiveerd." : "Artikel geactiveerd.");
        router.refresh();
      } catch {
        setError(
          "De status kon niet worden gewijzigd door een verbindingsprobleem. Probeer het opnieuw.",
        );
      }
    });
  }

  return (
    <div className="space-y-5">
      {items.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <Package size={15} aria-hidden="true" />
                Artikelen
              </div>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">{items.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <CircleCheck size={15} aria-hidden="true" />
                Actief
              </div>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">{activeCount}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/30 p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative min-w-0 flex-1 lg:max-w-md">
                <span className="sr-only">Zoek artikelen</span>
                <Search
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Zoek op omschrijving, categorie of eenheid…"
                  className={`${inputClass} pl-9`}
                />
              </label>
              <label className="min-w-40">
                <span className="sr-only">Filter op categorie</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Alle categorieën</option>
                  {categories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline-flex min-h-10 items-center gap-2 px-1 text-sm text-zinc-400">
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
                onClick={resetFilters}
                disabled={!hasFilters}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm text-zinc-400 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw size={14} aria-hidden="true" />
                Reset
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-sky-500 px-4 text-sm font-semibold text-zinc-950 hover:bg-sky-400 lg:ml-auto"
              >
                <Plus size={16} aria-hidden="true" />
                Nieuw artikel
              </button>
            </div>
            <p className="mt-3 px-1 text-xs text-zinc-500" aria-live="polite">
              {filtered.length} van {items.length} artikelen zichtbaar
            </p>
          </div>
        </div>
      ) : null}

      {error && !open && (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
        >
          <Check size={16} aria-hidden="true" />
          {success}
        </p>
      )}

      {items.length === 0 ? (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/50 shadow-[0_24px_80px_-48px_rgba(14,165,233,0.45)]">
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
            <div className="flex flex-col items-start px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-sky-400/15 bg-sky-500/10 text-sky-400 shadow-inner shadow-sky-400/5">
                <PackagePlus size={22} aria-hidden="true" />
              </span>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
                Eén keer invoeren, overal hergebruiken
              </p>
              <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                Bouw een betrouwbare basis voor elke offerte
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">
                Bewaar je vaste materialen, werkuren en diensten met hun eenheid,
                prijs en btw-tarief. Zo stel je offertes en facturen sneller en
                consistenter op.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-sky-500 px-5 text-sm font-semibold text-zinc-950 shadow-lg shadow-sky-950/30 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                <Plus size={17} aria-hidden="true" />
                Eerste artikel toevoegen
              </button>
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                Je kunt artikelen later altijd aanpassen of tijdelijk deactiveren.
              </p>
            </div>

            <div className="border-t border-white/10 bg-white/[0.025] px-6 py-8 sm:px-8 lg:border-l lg:border-t-0 lg:py-10">
              <p className="text-sm font-semibold text-zinc-200">Wat je hier beheert</p>
              <div className="mt-5 space-y-3">
                {[
                  {
                    icon: Package,
                    title: "Materialen",
                    description: "Vaste verkoopprijzen per stuk, meter of m².",
                  },
                  {
                    icon: CircleCheck,
                    title: "Werkuren",
                    description: "Uurtarieven voor plaatsing, afwerking en service.",
                  },
                  {
                    icon: Tags,
                    title: "Diensten",
                    description: "Herbruikbare prestaties met het juiste btw-tarief.",
                  },
                ].map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="flex gap-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4"
                  >
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/40 px-4 py-12 text-center">
          <p className="text-sm font-medium text-zinc-200">Geen artikelen gevonden</p>
          <p className="mt-1 text-sm text-zinc-500">Pas je zoekopdracht of filters aan.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-sky-300"
          >
            <RotateCcw size={14} />
            Filters wissen
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50">
          <div className="hidden grid-cols-[1.4fr_0.5fr_0.6fr_0.5fr_auto] gap-3 border-b border-white/10 px-5 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 md:grid">
            <span>Omschrijving</span>
            <span>Eenheid</span>
            <span>Prijs</span>
            <span>BTW</span>
            <span />
          </div>
          <div className="divide-y divide-white/10">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[1.4fr_0.5fr_0.6fr_0.5fr_auto] md:items-center md:px-5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-100">{item.omschrijving}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {item.categorie || "Algemeen"}
                    {!item.isActive ? " · inactief" : ""}
                  </p>
                </div>
                <dl className="grid grid-cols-3 gap-3 md:contents">
                  <div className="min-w-0 md:contents">
                    <dt className="text-[11px] uppercase tracking-wide text-zinc-600 md:sr-only">
                      Eenheid
                    </dt>
                    <dd className="mt-1 truncate text-sm text-zinc-300 md:mt-0">
                      {item.eenheid}
                    </dd>
                  </div>
                  <div className="min-w-0 md:contents">
                    <dt className="text-[11px] uppercase tracking-wide text-zinc-600 md:sr-only">
                      Prijs
                    </dt>
                    <dd className="mt-1 truncate text-sm font-medium text-zinc-100 md:mt-0">
                      {euro(item.prijs)}
                    </dd>
                  </div>
                  <div className="min-w-0 md:contents">
                    <dt className="text-[11px] uppercase tracking-wide text-zinc-600 md:sr-only">
                      BTW
                    </dt>
                    <dd className="mt-1 text-sm text-zinc-400 md:mt-0">
                      {item.btwPercentage}%
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3 md:border-0 md:pt-0">
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
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="prijslijst-form-title"
            aria-describedby={error ? "prijslijst-form-error" : undefined}
            aria-busy={pending}
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tags size={18} className="text-sky-400" />
                <h2 id="prijslijst-form-title" className="text-lg font-semibold text-zinc-100">
                  {editingId ? "Artikel bewerken" : "Nieuw artikel"}
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={pending}
                aria-label="Sluit formulier"
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {error && (
              <p
                id="prijslijst-form-error"
                role="alert"
                className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
              >
                {error}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label htmlFor="prijslijst-omschrijving" className="mb-1.5 block text-sm text-zinc-300">
                  Omschrijving <span aria-hidden="true">*</span>
                </label>
                <input
                  id="prijslijst-omschrijving"
                  className={inputClass}
                  autoFocus
                  required
                  value={form.omschrijving}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, omschrijving: e.target.value }))
                  }
                  placeholder="bv. Plaatsen gipskarton m²"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                <label htmlFor="prijslijst-eenheid" className="mb-1.5 block text-sm text-zinc-300">
                  Eenheid
                </label>
                <input
                  id="prijslijst-eenheid"
                    className={inputClass}
                    value={form.eenheid}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, eenheid: e.target.value }))
                    }
                    placeholder="stuks / m² / u"
                  />
                </div>
                <div>
                <label htmlFor="prijslijst-prijs" className="mb-1.5 block text-sm text-zinc-300">
                  Prijs (€) <span aria-hidden="true">*</span>
                </label>
                <input
                  id="prijslijst-prijs"
                  className={inputClass}
                  inputMode="decimal"
                  required
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
                <label htmlFor="prijslijst-btw" className="mb-1.5 block text-sm text-zinc-300">
                  BTW %
                </label>
                <input
                  id="prijslijst-btw"
                    className={inputClass}
                    inputMode="decimal"
                    value={form.btwPercentage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, btwPercentage: e.target.value }))
                    }
                  />
                </div>
                <div>
                <label htmlFor="prijslijst-categorie" className="mb-1.5 block text-sm text-zinc-300">
                  Categorie
                </label>
                <input
                  id="prijslijst-categorie"
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
                disabled={pending}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={pending || !form.omschrijving.trim()}
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
          </form>
        </div>
      )}
    </div>
  );
}
