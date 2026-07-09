"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  RefreshCw,
  FileText,
  FileClock,
  Pencil,
  X,
} from "lucide-react";
import { createFactuur } from "@/app/dashboard/facturen/actions";
import FactuurDocumentPreview from "@/components/dashboard/facturen/FactuurDocumentPreview";
import {
  lineTotals,
  formatEuro,
  type OfferteLijnInput,
} from "@/lib/offertes";
import type { FactuurDocumentType } from "@/lib/facturen";
import type { BedrijfLite } from "@/lib/documentData";

type Customer = {
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

export type FactuurDocumentContext = {
  defaultTemplate: string;
  templateId?: string;
  bedrijf: BedrijfLite;
};

const emptyLine: OfferteLijnInput = {
  omschrijving: "",
  aantal: 1,
  eenheid: "stuks",
  prijs_per_eenheid: 0,
  btw_percentage: 21,
};

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

export default function FactuurForm({
  customers,
  documentContext,
}: {
  customers: Customer[];
  documentContext: FactuurDocumentContext;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);

  const [documentType, setDocumentType] =
    useState<FactuurDocumentType>("factuur");
  const [customerId, setCustomerId] = useState<string>("");
  const [klantVrij, setKlantVrij] = useState("");
  const [datum, setDatum] = useState(today());
  const [vervaldatum, setVervaldatum] = useState(plusDays(14));
  const [omschrijving, setOmschrijving] = useState("");
  const [notities, setNotities] = useState("");
  const [lines, setLines] = useState<OfferteLijnInput[]>([{ ...emptyLine }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => lineTotals(lines), [lines]);
  const isProforma = documentType === "proforma";

  const selectedCustomer = customers.find((c) => String(c.id) === customerId);
  const klantNaam =
    (selectedCustomer ? selectedCustomer.name : klantVrij).trim() || "";

  function updateLine(i: number, patch: Partial<OfferteLijnInput>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, { ...emptyLine }]);
  }
  function removeLine(i: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, idx) => idx !== i)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const klant = selectedCustomer ? selectedCustomer.name : klantVrij.trim();
    if (!klant) {
      setError("Kies een klant of vul een klantnaam in.");
      return;
    }
    if (!hasValidLines(lines)) {
      setError("Voeg minstens één factuurlijn toe.");
      return;
    }

    setLoading(true);
    const res = await createFactuur({
      documentType,
      customerId: selectedCustomer ? selectedCustomer.id : null,
      klant,
      datum,
      vervaldatum: isProforma ? null : vervaldatum,
      omschrijving,
      notities,
      lines,
    });
    setLoading(false);

    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("id" in res && res.id) {
      router.push(`/dashboard/facturen/${res.id}`);
      router.refresh();
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60";

  const formFields = (
    <>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-200">
          Documenttype
        </label>
        <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-zinc-950/60 p-1">
          <DocTypeButton
            active={documentType === "factuur"}
            onClick={() => setDocumentType("factuur")}
            icon={<FileText size={15} />}
            label="Factuur"
            activeClass="bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/40"
          />
          <DocTypeButton
            active={isProforma}
            onClick={() => setDocumentType("proforma")}
            icon={<FileClock size={15} />}
            label="Proforma"
            activeClass="bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/40"
          />
        </div>
        {isProforma && (
          <p className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300/90">
            Een proforma is een voorlopig document en geldt niet als officiële
            factuur. Er wordt geen vervaldatum gebruikt.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-200">
            Klant
          </label>
          {customers.length > 0 ? (
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Kies een klant —</option>
              {customers.map((c) => (
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
              className={inputClass}
            />
          )}
          {customers.length > 0 && customerId === "" && (
            <input
              value={klantVrij}
              onChange={(e) => setKlantVrij(e.target.value)}
              placeholder="…of typ een nieuwe klantnaam"
              className={`${inputClass} mt-2`}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-200">
              Datum
            </label>
            <input
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-200">
              Vervaldatum
            </label>
            <input
              type="date"
              value={vervaldatum}
              onChange={(e) => setVervaldatum(e.target.value)}
              disabled={isProforma}
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-40`}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-200">
          Omschrijving (optioneel)
        </label>
        <input
          value={omschrijving}
          onChange={(e) => setOmschrijving(e.target.value)}
          placeholder="bijv. Werken maand juli"
          className={inputClass}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Factuurlijnen
          </h3>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/5"
          >
            <Plus size={13} /> Lijn toevoegen
          </button>
        </div>

        <div className="space-y-3 p-4">
          {lines.map((l, i) => {
            const lineTotal =
              (Number(l.aantal) || 0) * (Number(l.prijs_per_eenheid) || 0);
            const canRemove = lines.length > 1;
            return (
              <div
                key={i}
                className="grid grid-cols-12 items-end gap-2 rounded-xl border border-white/5 bg-zinc-900/40 p-2.5"
              >
                <div className="col-span-12 sm:col-span-4">
                  <label
                    htmlFor={`f-omschrijving-${i}`}
                    className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-500"
                  >
                    Omschrijving
                  </label>
                  <input
                    id={`f-omschrijving-${i}`}
                    value={l.omschrijving}
                    onChange={(e) =>
                      updateLine(i, { omschrijving: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={l.aantal}
                    onChange={(e) =>
                      updateLine(i, { aantal: Number(e.target.value) })
                    }
                    className={inputClass}
                    placeholder="Aantal"
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <input
                    value={l.eenheid}
                    onChange={(e) =>
                      updateLine(i, { eenheid: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Eenheid"
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={l.prijs_per_eenheid}
                    onChange={(e) =>
                      updateLine(i, {
                        prijs_per_eenheid: Number(e.target.value),
                      })
                    }
                    className={inputClass}
                    placeholder="Prijs"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <input
                    type="number"
                    step="any"
                    min={0}
                    max={100}
                    value={l.btw_percentage}
                    onChange={(e) =>
                      updateLine(i, {
                        btw_percentage: Number(e.target.value),
                      })
                    }
                    className={inputClass}
                    placeholder="BTW"
                  />
                </div>
                <div className="col-span-1 flex justify-end pb-1">
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    disabled={!canRemove}
                    className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:text-rose-400 disabled:opacity-30"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="col-span-12 text-right text-xs text-zinc-500">
                  Regeltotaal:{" "}
                  <span className="font-mono text-zinc-300">
                    {formatEuro(lineTotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <div className="ml-auto max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotaal</span>
              <span className="font-mono">{formatEuro(totals.subtotaal)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>BTW</span>
              <span className="font-mono">{formatEuro(totals.btw)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-1.5 font-semibold text-zinc-100">
              <span>Totaal</span>
              <span className="font-mono">{formatEuro(totals.totaal)}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-200">
          Notities (optioneel)
        </label>
        <textarea
          value={notities}
          onChange={(e) => setNotities(e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>
    </>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/facturen"
          className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft
            size={15}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Terug naar facturen
        </Link>
        <div className="flex flex-wrap items-center gap-2">
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
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Opslaan…
              </>
            ) : isProforma ? (
              "Proforma opslaan"
            ) : (
              "Factuur opslaan"
            )}
          </button>
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

        <FactuurDocumentPreview
          templateId={documentContext.templateId}
          defaultTemplate={documentContext.defaultTemplate}
          bedrijf={documentContext.bedrijf}
          customers={customers}
          customerId={customerId}
          klantVrij={klantVrij}
          documentType={documentType}
          datum={datum}
          vervaldatum={isProforma ? null : vervaldatum}
          omschrijving={omschrijving}
          notities={notities}
          lines={lines}
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
                {formFields}
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
    </div>
  );
}

function DocTypeButton({
  active,
  onClick,
  icon,
  label,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? activeClass : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
