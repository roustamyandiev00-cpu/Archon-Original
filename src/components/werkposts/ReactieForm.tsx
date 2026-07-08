"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { createReactie } from "@/app/dashboard/werkposts/actions";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60";

export default function ReactieForm({ werkpostId }: { werkpostId: string }) {
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

  if (verzonden) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        <CheckCircle2 size={16} /> Reactie verstuurd. Je ziet het verder
        verloop bij Comms zodra ze reageren.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={bericht}
        onChange={(e) => setBericht(e.target.value)}
        rows={3}
        placeholder="Korte toelichting: ervaring, beschikbaarheid, team…"
        className={`${inputClass} resize-none`}
        required
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="number"
          value={tarief}
          onChange={(e) => setTarief(e.target.value)}
          placeholder="Voorgesteld tarief/uur (optioneel)"
          className={`${inputClass} max-w-[220px]`}
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Reageren
        </button>
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
    </form>
  );
}
