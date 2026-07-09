"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Loader2,
  Ticket,
} from "lucide-react";
import ReferralProgram from "@/components/ReferralProgram";
import { fastButtonClass } from "@/components/FastLink";

export default function CTA() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [refCode, setRefCode] = useState("");
  const [showRef, setShowRef] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    router.prefetch("/register");
  }, [router]);

  function goRegister() {
    if (!email.trim()) return;
    const params = new URLSearchParams({ email: email.trim() });
    if (refCode.trim()) params.set("ref", refCode.trim());
    router.push(`/register?${params.toString()}`);
    setLoading(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    goRegister();
  }

  return (
    <section id="start" className="section-tint relative overflow-hidden py-20 sm:py-24">
      <div aria-hidden className="section-edge" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          {/* LINKS — start gratis */}
          <div className="panel-soft relative overflow-hidden px-6 py-12 sm:px-10 sm:py-14">
            <div className="aurora-glow opacity-70" />
            <div className="relative z-10">
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                Zie waar ArchonPro je bedrijf brengt
              </h2>
              <p className="mt-4 max-w-lg text-lg leading-relaxed text-zinc-400">
                De eerste CRM waar je van houdt. En de laatste die je ooit nodig
                hebt. Start vandaag gratis — zonder creditcard.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jij@bedrijf.be"
                    className="w-full rounded-full border border-white/10 bg-zinc-950/70 px-5 py-3.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className={fastButtonClass(
                      "group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-sky-500 px-7 py-3.5 text-sm font-semibold text-zinc-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60",
                    )}
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
                </div>

                <button
                  type="button"
                  onClick={() => setShowRef((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs text-violet-400 transition-colors hover:text-violet-300"
                >
                  <Ticket size={13} />
                  {showRef
                    ? "Uitnodigingscode verbergen"
                    : "Uitgenodigd door een collega? Vul je code in"}
                </button>

                {showRef && (
                  <input
                    type="text"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value)}
                    placeholder="Uitnodigingscode of link van je collega"
                    className="w-full rounded-xl border border-violet-500/25 bg-violet-500/5 px-4 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-violet-400/50"
                  />
                )}
              </form>

              <ul className="mt-6 flex flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:flex-wrap sm:gap-x-5">
                <li className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-400" />
                  Geen kredietkaart nodig
                </li>
                <li className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-400" />
                  Opzegbaar per maand
                </li>
                <li className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-400" />
                  GDPR-conform
                </li>
              </ul>
            </div>
          </div>

          {/* RECHTS — referral */}
          <ReferralProgram />
        </div>
      </div>
    </section>
  );
}
