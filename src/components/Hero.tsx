import { ArrowRight, CreditCard, Clock, Calendar } from "lucide-react";
import HeroDashboard from "@/components/HeroDashboard";
import { FastLink } from "@/components/FastLink";

export default function Hero() {
  return (
    <section className="relative min-h-svh overflow-x-hidden pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24">
      <div aria-hidden className="absolute inset-0 bg-[#060a10]" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_38%,rgba(14,165,233,0.14),transparent_65%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#080d14] via-[#0a1018] to-[#060a10]"
      />
      <div aria-hidden className="hero-pane-grid" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-6.5rem)] max-w-7xl items-center px-6 lg:min-h-[calc(100svh-8rem)]">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:gap-10 xl:gap-14">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center rounded-full border border-sky-500/35 bg-sky-500/[0.08] px-4 py-1.5 text-xs font-medium tracking-wide text-sky-300">
              N°1 CRM voor bouwbedrijven in België
            </div>

            <h1 className="text-[2.35rem] font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.35rem] xl:text-[3.5rem]">
              Het complete platform voor
              <span className="block text-sky-400">bouwbedrijven</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-7 text-zinc-400 sm:text-lg lg:mx-0">
              Offertes, projecten, facturen, planning en AI-assistenten. Alles
              wat je nodig hebt om meer te doen in minder tijd.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <FastLink
                href="/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_32px_-6px_rgba(14,165,233,0.55)] transition-colors hover:bg-sky-400 sm:w-auto"
              >
                Gratis 14 dagen proberen
                <ArrowRight
                  size={16}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </FastLink>
              <FastLink
                href="#start"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-transparent px-7 py-3.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-white/30 hover:bg-white/[0.04] sm:w-auto"
              >
                Plan een demo
              </FastLink>
            </div>

            <ul className="mt-8 flex flex-col items-center gap-3 text-sm text-zinc-500 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start lg:gap-x-7 lg:gap-y-2">
              <li className="flex items-center gap-2">
                <CreditCard size={15} className="shrink-0 text-sky-400/90" />
                Geen creditcard vereist
              </li>
              <li className="flex items-center gap-2">
                <Clock size={15} className="shrink-0 text-sky-400/90" />
                Setup in 2 minuten
              </li>
              <li className="flex items-center gap-2">
                <Calendar size={15} className="shrink-0 text-sky-400/90" />
                Annuleer wanneer je wilt
              </li>
            </ul>
          </div>

          <div className="relative lg:-mr-6 xl:-mr-10">
            <HeroDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}
