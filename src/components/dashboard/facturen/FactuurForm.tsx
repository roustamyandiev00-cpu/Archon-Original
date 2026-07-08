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
} from "lucide-react";
import { createFactuur } from "@/app/dashboard/facturen/actions";
import GlowCard from "@/components/dashboard/GlowCard";
import {
  lineTotals,
  formatEuro,
  formatDate,
  type OfferteLijnInput,
} from "@/lib/offertes";
import { documentTypeMeta, type FactuurDocumentType } from "@/lib/facturen";

type Customer = { id: number; name: string; company_name: string | null };

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

export default function FactuurForm({ customers }: { customers: Customer[] }) {
  const router = useRouter();

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
  const klantBedrijf = selectedCustomer?.company_name ?? "";

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

  return (
    <div className="space-y-5">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[45fr_55fr]">
        {/* LINKS — FORMULIER */}
        <GlowCard className="min-w-0" innerClassName="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Document type keuze */}
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
                  activeClass="bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/40"
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
                  Een proforma is een voorlopig document en geldt niet als
                  officiële factuur. Er wordt geen vervaldatum gebruikt.
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

            {/* Factuurlijnen */}
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
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-12 items-end gap-2 rounded-xl border border-white/5 bg-zinc-900/40 p-2.5"
                    >
                      <div className="col-span-12 sm:col-span-5">
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-500">
                          Omschrijving
                        </label>
                        <input
                          value={l.omschrijving}
                          onChange={(e) =>
                            updateLine(i, { omschrijving: e.target.value })
                          }
                          placeholder="bijv. Plaatsen keukenkasten"
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-500">
                          Aantal
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={l.aantal}
                          onChange={(e) =>
                            updateLine(i, { aantal: Number(e.target.value) })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-500">
                          Eenheid
                        </label>
                        <input
                          value={l.eenheid}
                          onChange={(e) =>
                            updateLine(i, { eenheid: e.target.value })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-500">
                          Prijs/st
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={l.prijs_per_eenheid}
                          onChange={(e) =>
                            updateLine(i, {
                              prijs_per_eenheid: Number(e.target.value),
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="mb-1 block text-[10px] uppercase tracking-wide text-zinc-500">
                          BTW%
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={l.btw_percentage}
                          onChange={(e) =>
                            updateLine(i, {
                              btw_percentage: Number(e.target.value),
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end pb-1">
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-rose-400"
                          aria-label="Lijn verwijderen"
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
              <label className="mb-1.5 block text-sm font-medium text-zinc-200">
                Notities (optioneel)
              </label>
              <textarea
                value={notities}
                onChange={(e) => setNotities(e.target.value)}
                rows={3}
                placeholder="Betaalvoorwaarden, gestructureerde mededeling, opmerkingen…"
                className={`${inputClass} resize-none`}
              />
            </div>

            {error && (
              <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/dashboard/facturen"
                className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
              >
                Annuleren
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
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
          </form>
        </GlowCard>

        {/* RECHTS — LIVE PREVIEW */}
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-1 flex-col rounded-[18px] border border-zinc-800 bg-[#0b0b0f] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Live preview
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/12 px-2.5 py-1 text-[11px] font-semibold text-sky-400">
                <RefreshCw size={11} /> Wordt automatisch bijgewerkt
              </span>
            </div>

            <FactuurPreview
              documentType={documentType}
              klantNaam={klantNaam}
              klantBedrijf={klantBedrijf}
              datum={datum}
              vervaldatum={isProforma ? null : vervaldatum}
              omschrijving={omschrijving}
              notities={notities}
              lines={lines}
              totals={totals}
            />
          </div>
        </div>
      </div>
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

function FactuurPreview({
  documentType,
  klantNaam,
  klantBedrijf,
  datum,
  vervaldatum,
  omschrijving,
  notities,
  lines,
  totals,
}: {
  documentType: FactuurDocumentType;
  klantNaam: string;
  klantBedrijf: string;
  datum: string;
  vervaldatum: string | null;
  omschrijving: string;
  notities: string;
  lines: OfferteLijnInput[];
  totals: { subtotaal: number; btw: number; totaal: number };
}) {
  const meta = documentTypeMeta(documentType);
  const heeftKlant = klantNaam.trim().length > 0;
  const isProforma = documentType === "proforma";

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col overflow-hidden rounded-lg bg-white text-zinc-900 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
      {/* Gekleurde balk bovenaan als visuele markering van het type */}
      <div className={`h-1.5 w-full ${meta.docBar}`} />

      <div className="flex flex-1 flex-col p-6 sm:p-9">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-bold tracking-tight text-zinc-900">
              ArchonPro
            </p>
            <p className="text-xs text-zinc-500">Facturatie</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-extrabold tracking-tight ${meta.docAccentText}`}>
              {meta.heading}
            </p>
            <p
              className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-semibold ${meta.docAccentBg} ${meta.docAccentText}`}
            >
              Concept
            </p>
          </div>
        </div>

        {isProforma && (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            Dit is een proforma en geldt niet als officiële factuur.
          </p>
        )}

        <div className="my-6 h-px bg-zinc-100" />

        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Aan
            </p>
            <p
              className={`mt-1 font-semibold ${
                heeftKlant ? "text-zinc-900" : "text-zinc-400"
              }`}
            >
              {heeftKlant ? klantNaam : "Klantnaam"}
            </p>
            {klantBedrijf && (
              <p className="text-sm text-zinc-600">{klantBedrijf}</p>
            )}
          </div>
          <div className="shrink-0 text-right text-sm">
            <p className="text-zinc-500">
              Datum:{" "}
              <span className="font-medium text-zinc-800">
                {formatDate(datum)}
              </span>
            </p>
            {!isProforma && (
              <p className="text-zinc-500">
                Vervaldatum:{" "}
                <span className="font-medium text-zinc-800">
                  {formatDate(vervaldatum)}
                </span>
              </p>
            )}
          </div>
        </div>

        {omschrijving.trim() && (
          <p className="mt-6 text-sm font-medium text-zinc-700">
            {omschrijving}
          </p>
        )}

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-[11px] uppercase tracking-wide text-zinc-400">
              <th className="py-2 font-semibold">Omschrijving</th>
              <th className="py-2 text-right font-semibold">Aantal</th>
              <th className="py-2 text-right font-semibold">Prijs</th>
              <th className="py-2 text-right font-semibold">Totaal</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const aantal = Number(l.aantal) || 0;
              const prijs = Number(l.prijs_per_eenheid) || 0;
              const leeg = !l.omschrijving.trim() && prijs === 0;
              return (
                <tr key={i} className="border-b border-zinc-100">
                  <td
                    className={`py-2.5 pr-2 ${
                      leeg ? "text-zinc-400" : "text-zinc-800"
                    }`}
                  >
                    {l.omschrijving.trim() || `Werk of dienst ${i + 1}`}
                  </td>
                  <td className="py-2.5 text-right text-zinc-700">
                    {aantal} {l.eenheid}
                  </td>
                  <td className="py-2.5 text-right text-zinc-700">
                    {formatEuro(prijs)}
                  </td>
                  <td className="py-2.5 text-right font-medium text-zinc-900">
                    {formatEuro(aantal * prijs)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-[260px] space-y-1.5 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotaal</span>
              <span className="font-mono">{formatEuro(totals.subtotaal)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>BTW</span>
              <span className="font-mono">{formatEuro(totals.btw)}</span>
            </div>
            <div
              className={`mt-1 flex justify-between rounded-md px-2.5 py-2 text-base font-bold ${meta.docAccentBg} ${meta.docAccentText}`}
            >
              <span>{isProforma ? "Totaal" : "Te betalen"}</span>
              <span className="font-mono">{formatEuro(totals.totaal)}</span>
            </div>
          </div>
        </div>

        {notities.trim() && (
          <div className="mt-8 border-t border-zinc-100 pt-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Notities
            </p>
            <p className="whitespace-pre-line text-sm text-zinc-600">
              {notities}
            </p>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4 text-[11px] text-zinc-400">
          <span>ArchonPro • {meta.label}</span>
          <span>Preview voorbeeld</span>
        </div>
      </div>
    </div>
  );
}
