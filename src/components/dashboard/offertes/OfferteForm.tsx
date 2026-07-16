"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  Send,
  RefreshCw,
  Pencil,
  X,
  Paperclip,
  UserPlus,
} from "lucide-react";
import SendOfferteModal from "@/components/dashboard/offertes/SendOfferteModal";
import OfferteDocumentPreview from "@/components/dashboard/offertes/OfferteDocumentPreview";
import PrijslijstPicker from "@/components/dashboard/prijslijst/PrijslijstPicker";
import type { PrijslijstPickItem } from "@/components/dashboard/prijslijst/types";
import { createOfferte, updateOfferte } from "@/app/dashboard/offertes/actions";
import { createKlant } from "@/app/dashboard/contacten/actions";
import { uploadOffertePhotosFromBase64 } from "@/app/dashboard/offertes/projecten/bestanden-actions";
import {
  lineTotals,
  formatEuro,
  type OfferteLijnInput,
} from "@/lib/offertes";
import type { BedrijfLite } from "@/lib/documentData";

export type OfferteFormCustomer = {
  id: number;
  name: string;
  company_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  btw?: string | null;
};

export type OfferteDocumentContext = {
  defaultTemplate: string;
  templateId?: string;
  bedrijf: BedrijfLite;
};

export type OfferteFormInitial = {
  customerId: string;
  klantVrij: string;
  datum: string;
  geldigTot: string;
  notes: string;
  projectNaam?: string;
  afmetingen?: string;
  lines: OfferteLijnInput[];
};

const emptyLine: OfferteLijnInput = {
  omschrijving: "",
  aantal: 1,
  eenheid: "stuks",
  prijs_per_eenheid: 0,
  btw_percentage: 21,
};

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-200";

function today() {
  return new Date().toISOString().slice(0, 10);
}
function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function hasValidLines(lines: OfferteLijnInput[]) {
  return lines.some(
    (l) => l.omschrijving.trim() !== "" || Number(l.prijs_per_eenheid) > 0,
  );
}

export default function OfferteForm({
  customers,
  documentContext,
  offerteId,
  initial,
  seedDraft,
  nummer,
  prijslijstItems = [],
}: {
  customers: OfferteFormCustomer[];
  documentContext: OfferteDocumentContext;
  offerteId?: number;
  initial?: OfferteFormInitial;
  seedDraft?: OfferteFormInitial;
  nummer?: string;
  prijslijstItems?: PrijslijstPickItem[];
}) {
  const router = useRouter();
  const isEdit = typeof offerteId === "number";
  const backHref = isEdit
    ? `/dashboard/offertes/${offerteId}`
    : "/dashboard/offertes";

  const [customerId, setCustomerId] = useState<string>(
    initial?.customerId ?? "",
  );
  const [klantVrij, setKlantVrij] = useState(initial?.klantVrij ?? "");
  const [datum, setDatum] = useState(initial?.datum ?? today());
  const [geldigTot, setGeldigTot] = useState(initial?.geldigTot ?? plusDays(30));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [projectNaam, setProjectNaam] = useState(initial?.projectNaam ?? "");
  const [afmetingen, setAfmetingen] = useState(initial?.afmetingen ?? "");
  const [lines, setLines] = useState<OfferteLijnInput[]>(
    initial?.lines && initial.lines.length > 0
      ? initial.lines.map((l) => ({ ...l }))
      : [{ ...emptyLine }],
  );
  const [customerList, setCustomerList] = useState(customers);
  const [newKlantOpen, setNewKlantOpen] = useState(false);
  const [newKlantName, setNewKlantName] = useState("");
  const [newKlantEmail, setNewKlantEmail] = useState("");
  const [newKlantBusy, setNewKlantBusy] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<
    { name: string; dataUrl: string }[]
  >([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [sendAfterSave, setSendAfterSave] = useState(false);
  const [savedOfferteId, setSavedOfferteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    setCustomerList(customers);
  }, [customers]);

  useEffect(() => {
    if (!seedDraft) return;

    const id = window.setTimeout(() => {
      setCustomerId(seedDraft.customerId);
      setKlantVrij(seedDraft.klantVrij);
      setDatum(seedDraft.datum);
      setGeldigTot(seedDraft.geldigTot);

      let cleanNotes = seedDraft.notes;
      if (
        cleanNotes.includes("Project Naam:") &&
        cleanNotes.includes("Beschrijving werkzaamheden:")
      ) {
        const match = cleanNotes.match(/Beschrijving werkzaamheden:\s*([\s\S]*)/i);
        if (match && match[1]) {
          cleanNotes = match[1].trim();
        }
      }
      setNotes(cleanNotes);

      const cleanLines = seedDraft.lines.map((l) => {
        let desc = l.omschrijving;
        if (
          desc.includes("Project Naam:") &&
          desc.includes("Beschrijving werkzaamheden:")
        ) {
          const match = desc.match(/Beschrijving werkzaamheden:\s*([\s\S]*)/i);
          desc =
            match && match[1] ? match[1].trim() : "Werken volgens beschrijving";
        }
        return { ...l, omschrijving: desc };
      });
      setLines(cleanLines);
    }, 0);

    return () => window.clearTimeout(id);
  }, [seedDraft]);

  const totals = useMemo(() => lineTotals(lines), [lines]);

  function updateLine(i: number, patch: Partial<OfferteLijnInput>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, { ...emptyLine }]);
  }
  function removeLine(i: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, idx) => idx !== i)));
  }
  function addFromPrijslijst(item: PrijslijstPickItem) {
    const next: OfferteLijnInput = {
      omschrijving: item.omschrijving,
      aantal: 1,
      eenheid: item.eenheid || "stuks",
      prijs_per_eenheid: item.prijs,
      btw_percentage: item.btwPercentage,
    };
    setLines((ls) => {
      const last = ls[ls.length - 1];
      const lastEmpty =
        last &&
        last.omschrijving.trim() === "" &&
        Number(last.prijs_per_eenheid) === 0;
      if (lastEmpty) {
        return [...ls.slice(0, -1), next];
      }
      return [...ls, next];
    });
  }

  async function handleCreateKlant() {
    const name = newKlantName.trim() || klantVrij.trim();
    if (!name) {
      setError("Vul een klantnaam in.");
      return;
    }
    setNewKlantBusy(true);
    setError(null);
    const res = await createKlant({
      name,
      email: newKlantEmail.trim() || undefined,
    });
    setNewKlantBusy(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("id" in res && res.id) {
      const id = res.id as number;
      setCustomerList((prev) => [
        {
          id,
          name,
          company_name: null,
          email: newKlantEmail.trim() || null,
        },
        ...prev,
      ]);
      setCustomerId(String(id));
      setKlantVrij("");
      setNewKlantOpen(false);
      setNewKlantName("");
      setNewKlantEmail("");
    }
  }

  function onPhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPendingPhotos((prev) => [
          ...prev,
          { name: file.name, dataUrl },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent, andSend = false) {
    e.preventDefault();
    setError(null);

    const selected = customerList.find((c) => String(c.id) === customerId);
    const klant = selected ? selected.name : klantVrij.trim();
    if (!klant) {
      setError("Kies een klant of vul een klantnaam in.");
      return;
    }
    if (!hasValidLines(lines)) {
      setError("Voeg minstens één offertelijn toe.");
      return;
    }

    setLoading(true);
    if (andSend) setSendAfterSave(true);
    const payload = {
      customerId: selected ? selected.id : null,
      klant,
      datum,
      geldigTot,
      notes,
      lines,
      projectNaam: projectNaam.trim() || null,
      afmetingen: afmetingen.trim() || null,
    };
    const res = isEdit
      ? await updateOfferte({ id: offerteId, ...payload })
      : await createOfferte(payload);

    if ("error" in res && res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    if ("id" in res && res.id) {
      if (pendingPhotos.length > 0) {
        await uploadOffertePhotosFromBase64({
          offerteId: res.id,
          customerId: selected?.id ?? null,
          photos: pendingPhotos,
        });
        setPendingPhotos([]);
      }
      if (!isEdit && andSend) {
        setSavedOfferteId(res.id);
        setSendAfterSave(true);
        setLoading(false);
        return;
      }
      router.push(`/dashboard/offertes/${res.id}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-5" id="offerte-form-root">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft
            size={15}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          {isEdit ? "Terug naar offerte" : "Terug naar offertes"}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-zinc-900/60 px-3 py-1 font-mono text-xs text-zinc-300">
            {nummer ?? "Concept"}
          </span>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
          >
            <Pencil size={14} />
            Gegevens invullen
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={(e) => void handleSubmit(e)}
            className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-5 py-2 text-sm font-semibold text-sky-300 transition-colors hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && !sendAfterSave ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Opslaan…
              </>
            ) : isEdit ? (
              "Wijzigingen opslaan"
            ) : (
              "Offerte opslaan"
            )}
          </button>
          {!isEdit && (
            <button
              type="button"
              disabled={loading}
              onClick={(e) => void handleSubmit(e, true)}
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && sendAfterSave ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Bezig…
                </>
              ) : (
                <>
                  <Send size={16} />
                  Versturen
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="flex min-w-0 flex-col rounded-[18px] border border-zinc-800 bg-[#0b0b0f] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Sjabloon
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/12 px-2.5 py-1 text-[11px] font-semibold text-sky-400">
            <RefreshCw size={11} /> Wordt automatisch bijgewerkt
          </span>
        </div>

        <OfferteDocumentPreview
          embedded
          templateId={documentContext.templateId}
          defaultTemplate={documentContext.defaultTemplate}
          bedrijf={documentContext.bedrijf}
          customers={customerList}
          customerId={customerId}
          klantVrij={klantVrij}
          datum={datum}
          geldigTot={geldigTot}
          notes={notes}
          lines={lines}
          nummer={nummer}
        />
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            aria-label="Sluiten"
            onClick={() => setFormOpen(false)}
          />
          <div className="relative z-10 ml-auto flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold text-zinc-100">
                Gegevens invullen
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-zinc-200">Klant</label>
                    <button
                      type="button"
                      onClick={() => {
                        setNewKlantOpen((o) => !o);
                        setNewKlantName(klantVrij);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300"
                    >
                      <UserPlus size={12} />
                      Nieuwe klant
                    </button>
                  </div>
                  {customerList.length > 0 ? (
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className={fieldClass}
                    >
                      <option value="">— Kies een klant —</option>
                      {customerList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {c.company_name ? ` (${c.company_name})` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={klantVrij}
                      onChange={(e) => setKlantVrij(e.target.value)}
                      placeholder="Naam van de klant"
                      className={fieldClass}
                    />
                  )}
                  {customerList.length > 0 && customerId === "" && (
                    <input
                      value={klantVrij}
                      onChange={(e) => setKlantVrij(e.target.value)}
                      placeholder="…of typ een nieuwe klantnaam"
                      className={`${fieldClass} mt-2`}
                    />
                  )}
                  {newKlantOpen && (
                    <div className="mt-2 space-y-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                      <input
                        value={newKlantName}
                        onChange={(e) => setNewKlantName(e.target.value)}
                        placeholder="Klantnaam *"
                        className={fieldClass}
                      />
                      <input
                        value={newKlantEmail}
                        onChange={(e) => setNewKlantEmail(e.target.value)}
                        placeholder="E-mail (optioneel)"
                        type="email"
                        className={fieldClass}
                      />
                      <button
                        type="button"
                        disabled={newKlantBusy}
                        onClick={() => void handleCreateKlant()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 disabled:opacity-60"
                      >
                        {newKlantBusy ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <UserPlus size={12} />
                        )}
                        Opslaan in contacten
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Datum</label>
                    <input
                      type="date"
                      value={datum}
                      onChange={(e) => setDatum(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Geldig tot</label>
                    <input
                      type="date"
                      value={geldigTot}
                      onChange={(e) => setGeldigTot(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Project / werf</label>
                  <input
                    value={projectNaam}
                    onChange={(e) => setProjectNaam(e.target.value)}
                    placeholder="bv. Renovatie badkamer Peeters"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Afmetingen</label>
                  <input
                    value={afmetingen}
                    onChange={(e) => setAfmetingen(e.target.value)}
                    placeholder="bv. 12 m² of 3 × 4 m"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className={labelClass}>Foto&apos;s / bijlagen</label>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300"
                  >
                    <Paperclip size={12} />
                    Uploaden
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={onPhotoPick}
                  />
                </div>
                {pendingPhotos.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {pendingPhotos.map((p, i) => (
                      <li
                        key={`${p.name}-${i}`}
                        className="inline-flex max-w-full items-center gap-1 rounded-md border border-white/10 bg-zinc-900/60 px-2 py-1 text-[11px] text-zinc-300"
                      >
                        <span className="truncate">{p.name}</span>
                        <button
                          type="button"
                          className="text-zinc-500 hover:text-rose-400"
                          onClick={() =>
                            setPendingPhotos((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                        >
                          <X size={11} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-zinc-500">
                    Foto&apos;s worden bij opslaan aan de offerte gekoppeld.
                  </p>
                )}
              </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Offertelijnen
                </h3>
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/5"
                >
                  <Plus size={13} /> Lijn toevoegen
                </button>
              </div>

              <div className="border-b border-white/10 px-4 py-3">
                <PrijslijstPicker
                  items={prijslijstItems}
                  onPick={addFromPrijslijst}
                />
              </div>

              <div className="space-y-3 p-4">
                {lines.map((l, i) => {
                  const lineTotal =
                    (Number(l.aantal) || 0) * (Number(l.prijs_per_eenheid) || 0);
                  const canRemove = lines.length > 1;
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-2 items-end gap-2 rounded-xl border border-white/5 bg-zinc-900/40 p-2.5 transition-colors focus-within:border-sky-500/30 hover:border-white/10 sm:grid-cols-12"
                    >
                      <div className="col-span-2 sm:col-span-4">
                        <label
                          htmlFor={`o-omschrijving-${i}`}
                          className="mb-1 block truncate text-[10px] uppercase tracking-wide text-zinc-500"
                        >
                          Omschrijving
                        </label>
                        <input
                          id={`o-omschrijving-${i}`}
                          value={l.omschrijving}
                          onChange={(e) =>
                            updateLine(i, { omschrijving: e.target.value })
                          }
                          placeholder="bijv. Plaatsen keukenkasten"
                          className={fieldClass}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label
                          htmlFor={`o-aantal-${i}`}
                          className="mb-1 block truncate text-[10px] uppercase tracking-wide text-zinc-500"
                        >
                          Aantal
                        </label>
                        <input
                          id={`o-aantal-${i}`}
                          type="number"
                          step="any"
                          min={0}
                          value={l.aantal}
                          onChange={(e) =>
                            updateLine(i, { aantal: Number(e.target.value) })
                          }
                          className={fieldClass}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label
                          htmlFor={`o-eenheid-${i}`}
                          className="mb-1 block truncate text-[10px] uppercase tracking-wide text-zinc-500"
                        >
                          Eenheid
                        </label>
                        <input
                          id={`o-eenheid-${i}`}
                          value={l.eenheid}
                          onChange={(e) =>
                            updateLine(i, { eenheid: e.target.value })
                          }
                          className={fieldClass}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label
                          htmlFor={`o-prijs-${i}`}
                          className="mb-1 block truncate text-[10px] uppercase tracking-wide text-zinc-500"
                        >
                          Prijs/st
                        </label>
                        <input
                          id={`o-prijs-${i}`}
                          type="number"
                          step="any"
                          min={0}
                          value={l.prijs_per_eenheid}
                          onChange={(e) =>
                            updateLine(i, {
                              prijs_per_eenheid: Number(e.target.value),
                            })
                          }
                          className={fieldClass}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-1">
                        <label
                          htmlFor={`o-btw-${i}`}
                          className="mb-1 block truncate text-[10px] uppercase tracking-wide text-zinc-500"
                        >
                          BTW%
                        </label>
                        <input
                          id={`o-btw-${i}`}
                          type="number"
                          step="any"
                          min={0}
                          value={l.btw_percentage}
                          onChange={(e) =>
                            updateLine(i, {
                              btw_percentage: Number(e.target.value),
                            })
                          }
                          className={fieldClass}
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:flex-col sm:items-stretch sm:justify-end">
                        <span className="text-xs tabular-nums text-zinc-400 sm:hidden">
                          {formatEuro(lineTotal)}
                        </span>
                        <button
                          type="button"
                          disabled={!canRemove}
                          onClick={() => removeLine(i)}
                          className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-30"
                          aria-label="Regel verwijderen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-white/10 px-4 py-3">
                <div className="ml-auto max-w-xs space-y-1.5 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotaal</span>
                    <span className="font-mono">
                      {formatEuro(totals.subtotaal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>BTW</span>
                    <span className="font-mono">{formatEuro(totals.btw)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1.5 text-base font-semibold text-zinc-100">
                    <span>Totaal</span>
                    <span className="font-mono">
                      {formatEuro(totals.totaal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Notities (optioneel)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Bijkomende voorwaarden, planning, opmerkingen…"
                className={`${fieldClass} resize-none`}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
              >
                Sluiten
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Opslaan…
                  </>
                ) : (
                  "Opslaan"
                )}
              </button>
            </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {savedOfferteId != null && (
        <SendOfferteModal
          offerteId={savedOfferteId}
          open={sendAfterSave}
          onClose={() => {
            setSendAfterSave(false);
            router.push(`/dashboard/offertes/${savedOfferteId}`);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
