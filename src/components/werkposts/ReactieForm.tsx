"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, Building2 } from "lucide-react";
import { createReactie } from "@/app/dashboard/werkposts/actions";
import CompanySetupCard from "./CompanySetupCard";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10";

export default function ReactieForm({
  werkpostId,
  hasCompany = true,
}: {
  werkpostId: string;
  hasCompany?: boolean;
}) {
  const [bericht, setBericht] = useState("");
  const [tarief, setTarief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verzonden, setVerzonden] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await createReactie(werkpostId, {
      bericht,
      voorgesteldTarief: tarief ? Number(tarief) : null,
      beschikbaarheidVanaf: null,
      beschikbaarheidTot: null,
    });
    setLoading(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setVerzonden(true);
  }

  // Als de gebruiker ingelogd is maar geen bedrijfsprofiel heeft afgerond
  if (!hasCompany) {
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 text-center">
        <div className="flex justify-center mb-2">
          <Building2 size={24} className="text-amber-400" />
        </div>
        <h4 className="text-sm font-semibold text-zinc-100">
          Bedrijfsprofiel vereist
        </h4>
        <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto mb-4">
          Om te kunnen reageren op opdrachten moet je account eerst gekoppeld zijn aan een bedrijf. Vul hieronder je bedrijfsnaam in om direct door te gaan.
        </p>
        <div className="max-w-md mx-auto">
          <CompanySetupCard />
        </div>
      </div>
    );
  }

  if (verzonden) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3.5 text-sm text-emerald-300">
        <CheckCircle2 size={16} className="shrink-0" />
        <div>
          <p className="font-semibold">Reactie succesvol verzonden!</p>
          <p className="text-xs text-emerald-400/80 mt-0.5">
            Zodra het bedrijf je reactie accepteert, wordt er een chat geopend onder <strong>Samenwerkingen</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Stuur een bericht naar dit bedrijf
        </label>
        <textarea
          value={bericht}
          onChange={(e) => setBericht(e.target.value)}
          rows={3}
          placeholder="Stel je bedrijf kort voor, vermeld relevante ervaring en wanneer je beschikbaar bent..."
          className={`${inputClass} resize-none`}
          required
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-[280px]">
          <input
            type="number"
            value={tarief}
            onChange={(e) => setTarief(e.target.value)}
            placeholder="Voorgesteld tarief (€/uur, optioneel)"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-sky-400 hover:shadow-[0_0_12px_rgba(14,165,233,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={13} />
          )}
          Reageren
        </button>
      </div>
      
      {error && (
        <p className="text-sm font-medium text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </form>
  );
}
