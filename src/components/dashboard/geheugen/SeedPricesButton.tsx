"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { seedPriceMemories } from "@/app/dashboard/geheugen/actions";

export default function SeedPricesButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await seedPriceMemories();
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("ok" in result && result.ok) {
        setMessage(
          result.seeded === 0
            ? result.skipped > 0
              ? "Geen nieuwe prijzen — alles stond al in geheugen."
              : "Geen offerte-lijnen met prijzen gevonden."
            : `${result.seeded} prijs${result.seeded === 1 ? "" : "en"} geleerd uit offertes.`,
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/20 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Sparkles size={13} />
        )}
        Leer prijzen uit offertes
      </button>
      {message && <p className="text-[11px] text-emerald-400">{message}</p>}
      {error && <p className="text-[11px] text-rose-400">{error}</p>}
    </div>
  );
}
