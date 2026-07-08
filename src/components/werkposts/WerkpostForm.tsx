"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createWerkpost } from "@/app/dashboard/werkposts/actions";
import { REGIOS } from "@/lib/werkposts";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-200";

export default function WerkpostForm({
  onCreated,
}: {
  /** Waar naartoe navigeren na succesvol plaatsen. Default: dashboard-detail. */
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const [titel, setTitel] = useState("");
  const [type, setType] = useState<"vraag" | "aanbod">("vraag");
  const [urgentie, setUrgentie] = useState<"normaal" | "urgent" | "zeer_urgent">(
    "normaal",
  );
  const [beschrijving, setBeschrijving] = useState("");
  const [aardVanWerk, setAardVanWerk] = useState("");
  const [regio, setRegio] = useState("");
  const [stad, setStad] = useState("");
  const [postcode, setPostcode] = useState("");
  const [adres, setAdres] = useState("");
  const [aantalPersonen, setAantalPersonen] = useState(1);
  const [startdatum, setStartdatum] = useState("");
  const [einddatum, setEinddatum] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [tariefPerUur, setTariefPerUur] = useState("");
  const [vaardigheden, setVaardigheden] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await createWerkpost({
      titel,
      beschrijving,
      aardVanWerk,
      type,
      urgentie,
      regio,
      stad,
      postcode,
      adres,
      aantalPersonen: Number(aantalPersonen) || 1,
      startdatum,
      einddatum,
      geschatteDuurDagen: null,
      budgetMin: budgetMin ? Number(budgetMin) : null,
      budgetMax: budgetMax ? Number(budgetMax) : null,
      tariefPerUur: tariefPerUur ? Number(tariefPerUur) : null,
      tariefType: "uur",
      vereisteVaardigheden: vaardigheden
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    });

    setLoading(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("id" in res && res.id) {
      if (onCreated) onCreated(res.id);
      else router.push(`/dashboard/werkposts/${res.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Titel</label>
          <input
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="bijv. Metselaars gezocht voor nieuwbouw"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "vraag" | "aanbod")}
            className={inputClass}
          >
            <option value="vraag">Ik zoek personeel (vraag)</option>
            <option value="aanbod">Ik heb personeel beschikbaar (aanbod)</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Urgentie</label>
          <select
            value={urgentie}
            onChange={(e) =>
              setUrgentie(e.target.value as "normaal" | "urgent" | "zeer_urgent")
            }
            className={inputClass}
          >
            <option value="normaal">Normaal</option>
            <option value="urgent">Urgent</option>
            <option value="zeer_urgent">Zeer urgent</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Omschrijving</label>
          <textarea
            value={beschrijving}
            onChange={(e) => setBeschrijving(e.target.value)}
            rows={4}
            placeholder="Beschrijf het werk, vereiste ervaring, planning…"
            className={`${inputClass} resize-none`}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Aard van het werk</label>
          <input
            value={aardVanWerk}
            onChange={(e) => setAardVanWerk(e.target.value)}
            placeholder="bijv. Ruwbouw, afwerking, elektriciteit…"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Regio</label>
          <input
            value={regio}
            onChange={(e) => setRegio(e.target.value)}
            list="regio-opties"
            placeholder="bijv. Antwerpen"
            className={inputClass}
            required
          />
          <datalist id="regio-opties">
            {REGIOS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelClass}>Stad</label>
          <input
            value={stad}
            onChange={(e) => setStad(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Postcode</label>
          <input
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Adres (optioneel)</label>
          <input
            value={adres}
            onChange={(e) => setAdres(e.target.value)}
            placeholder="Straat en nummer"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Aantal personen</label>
          <input
            type="number"
            min={1}
            value={aantalPersonen}
            onChange={(e) => setAantalPersonen(Number(e.target.value))}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Startdatum</label>
          <input
            type="date"
            value={startdatum}
            onChange={(e) => setStartdatum(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Einddatum (optioneel)</label>
          <input
            type="date"
            value={einddatum}
            onChange={(e) => setEinddatum(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Budget min. (€, optioneel)</label>
          <input
            type="number"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Budget max. (€, optioneel)</label>
          <input
            type="number"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tarief per uur (€, optioneel)</label>
          <input
            type="number"
            value={tariefPerUur}
            onChange={(e) => setTariefPerUur(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>
            Vereiste vaardigheden (komma-gescheiden, optioneel)
          </label>
          <input
            value={vaardigheden}
            onChange={(e) => setVaardigheden(e.target.value)}
            placeholder="bijv. metselen, betonstorten, VCA"
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Plaatsen…
            </>
          ) : (
            "Werkpost plaatsen"
          )}
        </button>
      </div>
    </form>
  );
}
