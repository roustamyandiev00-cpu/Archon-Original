import Link from "next/link";
import { ArrowRight, CreditCard, Clock, ShieldCheck } from "lucide-react";
import HeroDashboard from "@/components/HeroDashboard";

export default function Hero() {
  return (
    <section className="relative overflow-x-hidden pt-28 pb-20 sm:pb-24 lg:pt-36 lg:pb-28">
      {/* Achtergrond: donker met subtiele bouw-/premium-sfeer */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-sky-950/40"
      />
      <div className="aurora-glow opacity-50" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_70%_40%,rgba(14,165,233,0.12),transparent_60%)]"
      />
      <div className="grid-fade absolute inset-0 opacity-40" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          {/* LINKS — info & knoppen */}
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1.5 text-xs font-medium text-sky-300">
              N°1 CRM voor bouwbedrijven in België
            </div>

            <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-50 sm:text-5xl lg:text-[3.25rem]">
              Het complete platform voor{" "}
              <span className="text-sky-400">bouwbedrijven</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-8 text-zinc-400 lg:mx-0">
              Offertes, projecten, facturen, planning en AI-assistenten. Alles
              wat je nodig hebt om meer te doen in minder tijd.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-7 py-3.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400 sm:w-auto"
              >
                Gratis 14 dagen proberen
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="#features"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/10 sm:w-auto"
              >
                Plan een demo
              </Link>
            </div>

            <ul className="mt-8 flex flex-col items-center gap-3 text-sm text-zinc-500 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start lg:gap-x-6 lg:gap-y-2">
              <li className="flex items-center gap-2">
                <CreditCard size={15} className="shrink-0 text-sky-400/80" />
                Geen creditcard vereist
              </li>
              <li className="flex items-center gap-2">
                <Clock size={15} className="shrink-0 text-sky-400/80" />
                Setup in 2 minuten
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={15} className="shrink-0 text-sky-400/80" />
                Annuleer wanneer je wilt
              </li>
            </ul>
          </div>

          {/* RECHTS — dashboard + smartphone */}
          <div className="overflow-visible pb-16 pr-2 sm:pb-20 sm:pr-4 lg:pl-2 lg:pr-8">
            <HeroDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}
