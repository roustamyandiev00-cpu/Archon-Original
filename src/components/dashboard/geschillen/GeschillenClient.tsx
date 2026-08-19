"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Scale } from "lucide-react";
import GlowCard from "@/components/dashboard/GlowCard";
import {
  createGeschil,
  fileGeschilBezwaar,
  submitGeschilVerklaring,
} from "@/app/dashboard/geschillen/actions";

export default function GeschillenClient({
  companyId,
  geschillen,
  directory,
}: {
  companyId: number;
  geschillen: Array<Record<string, unknown>>;
  directory: Array<{ id: number; naam: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [titel, setTitel] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [tegenpartij, setTegenpartij] = useState<number | "">("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createGeschil({
        titel,
        beschrijving,
        tegenpartijCompanyId: tegenpartij ? Number(tegenpartij) : null,
      });
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setTitel("");
      setBeschrijving("");
      setTegenpartij("");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-500/10 text-rose-400">
          <Scale size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Geschillen</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            AI maakt een neutrale samenvatting; een beheerder beslist. Bezwaar
            is mogelijk na uitspraak.
          </p>
        </div>
      </header>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <GlowCard innerClassName="p-4 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-100">Nieuw geschil</h2>
        <form onSubmit={submit} className="space-y-2">
          <input
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="Titel"
            className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm"
            required
          />
          <select
            value={tegenpartij}
            onChange={(e) =>
              setTegenpartij(e.target.value ? Number(e.target.value) : "")
            }
            className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm"
          >
            <option value="">Tegenpartij (optioneel)</option>
            {directory.map((d) => (
              <option key={d.id} value={d.id}>
                {d.naam}
              </option>
            ))}
          </select>
          <textarea
            value={beschrijving}
            onChange={(e) => setBeschrijving(e.target.value)}
            rows={4}
            placeholder="Beschrijf het probleem feitelijk…"
            className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm"
            required
            minLength={20}
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-rose-500/90 px-4 py-2 text-sm font-semibold text-white"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            Indienen
          </button>
        </form>
      </GlowCard>

      <div className="space-y-3">
        {geschillen.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">Nog geen geschillen.</p>
        ) : (
          geschillen.map((g) => {
            const id = String(g.id);
            const isMelder = g.melder_company_id === companyId;
            return (
              <GlowCard key={id} innerClassName="p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {String(g.titel)}
                  </h3>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase text-zinc-400">
                    {String(g.status)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 whitespace-pre-wrap">
                  {String(g.beschrijving)}
                </p>
                {g.ai_samenvatting ? (
                  <p className="rounded-lg border border-white/5 bg-zinc-950/40 p-2 text-xs text-zinc-300 whitespace-pre-wrap">
                    {String(g.ai_samenvatting)}
                  </p>
                ) : null}
                {g.motivatie ? (
                  <p className="text-xs text-emerald-300">
                    Uitspraak: {String(g.motivatie)}
                  </p>
                ) : null}

                {(g.status === "samenvatting_klaar" ||
                  g.status === "verklaringen" ||
                  g.status === "ingediend") && (
                  <VerklaringForm
                    geschilId={id}
                    asMelder={isMelder}
                    onDone={() => router.refresh()}
                  />
                )}

                {g.status === "beslist" && (
                  <button
                    type="button"
                    className="text-xs text-amber-300 underline"
                    onClick={() =>
                      startTransition(async () => {
                        const reden = window.prompt("Reden van bezwaar?");
                        if (!reden) return;
                        await fileGeschilBezwaar({ geschilId: id, reden });
                        router.refresh();
                      })
                    }
                  >
                    Bezwaar indienen
                  </button>
                )}
              </GlowCard>
            );
          })
        )}
      </div>
    </div>
  );
}

function VerklaringForm({
  geschilId,
  asMelder,
  onDone,
}: {
  geschilId: string;
  asMelder: boolean;
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-2 border-t border-white/5 pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await submitGeschilVerklaring({
            geschilId,
            verklaring: text,
            asMelder,
          });
          setText("");
          onDone();
        });
      }}
    >
      <p className="text-[11px] text-zinc-500">
        Jouw verklaring ({asMelder ? "melder" : "tegenpartij"})
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-2 py-1.5 text-xs"
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200"
      >
        Verklaring indienen
      </button>
    </form>
  );
}
