"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function CTA() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("demo_leads")
      .insert({ email: email.trim(), source: "landingpage-cta" });
    setLoading(false);
    if (error) {
      setError("Er ging iets mis. Probeer het later opnieuw.");
      return;
    }
    setDone(true);
  }

  return (
    <section id="start" className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 px-6 py-16 text-center sm:px-12">
          <div className="aurora-glow opacity-80" />
          <div className="relative z-10">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Zie waar ArchonPro je bedrijf brengt
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
              De eerste CRM waar je van houdt. En de laatste die je ooit nodig
              hebt. Start vandaag gratis, zonder creditcard.
            </p>

            {done ? (
              <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-400">
                <Check size={16} /> Bedankt! We nemen snel contact met je op.
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jij@bedrijf.be"
                  className="w-full rounded-full border border-white/10 bg-zinc-950/70 px-5 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Bezig…
                    </>
                  ) : (
                    <>
                      Start gratis
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </form>
            )}

            {error && (
              <p className="mt-4 text-sm text-rose-400">{error}</p>
            )}

            <p className="mt-5 text-xs text-zinc-500">
              Geen kredietkaart nodig · Opzegbaar per maand · GDPR-conform
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
