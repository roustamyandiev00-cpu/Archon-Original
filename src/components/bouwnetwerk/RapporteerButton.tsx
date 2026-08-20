"use client";

import { useState, useTransition } from "react";
import { Flag, Loader2, X } from "lucide-react";
import {
  createContentRapportage,
  type ContentRapportageTargetType,
} from "@/app/dashboard/bouwnetwerk/rapportage-actions";

export default function RapporteerButton({
  targetType,
  targetId,
  compact = false,
}: {
  targetType: ContentRapportageTargetType;
  targetId: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reden, setReden] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createContentRapportage({
        targetType,
        targetId,
        reden,
      });
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setDone(true);
      setReden("");
      setTimeout(() => {
        setOpen(false);
        setDone(false);
      }, 1200);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:bg-white/5 hover:text-rose-300"
            : "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/40 px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition hover:border-rose-500/30 hover:text-rose-300"
        }
        title="Rapporteer"
      >
        <Flag size={compact ? 10 : 12} />
        {!compact && "Rapporteer"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
            >
              <X size={16} />
            </button>
            <h3 className="text-base font-semibold text-zinc-50">
              Inhoud rapporteren
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Je melding gaat naar het platform-beheer. Misbruik van rapportages
              kan zelf tot maatregelen leiden.
            </p>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <textarea
                value={reden}
                onChange={(e) => setReden(e.target.value)}
                rows={4}
                required
                minLength={5}
                placeholder="Waarom rapporteer je dit? (bv. belediging, spam, fraude…)"
                className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-rose-500/40"
              />
              {error && (
                <p className="text-xs text-rose-400">{error}</p>
              )}
              {done && (
                <p className="text-xs text-emerald-400">
                  Melding ontvangen. Bedankt.
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={pending || done}
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/90 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {pending && <Loader2 size={12} className="animate-spin" />}
                  Verstuur melding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
