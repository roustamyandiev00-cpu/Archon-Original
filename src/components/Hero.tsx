import {
  ArrowRight,
  Play,
  Shield,
  Zap,
  Lock,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import HeroDashboard from "@/components/HeroDashboard";
import HeroTrustBar from "@/components/HeroTrustBar";
import { FastLink } from "@/components/FastLink";

export default function Hero() {
  return (
    <section className="relative flex w-full flex-col overflow-hidden bg-[#030914]">
      <Image
        src="/hero-executive-blueprint.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover object-center"
        aria-hidden
      />
      <div aria-hidden className="absolute inset-0 bg-[#020711]/20" />

      <div className="relative z-10 flex flex-1 flex-col pt-[calc(5rem+env(safe-area-inset-top))] sm:pt-[calc(5.75rem+env(safe-area-inset-top))] lg:pt-[calc(6.5rem+env(safe-area-inset-top))]">
        <div className="mx-auto grid w-full max-w-[90rem] min-w-0 grid-cols-[minmax(0,1fr)] flex-1 items-center gap-10 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] lg:gap-8 lg:px-10 lg:pb-12 xl:gap-12">
          <div className="w-full min-w-0 max-w-xl text-center lg:max-w-[36rem] lg:text-left">
              <div className="mb-5 inline-flex max-w-full items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-300 sm:mb-6 sm:text-xs">
                <Sparkles size={13} className="shrink-0 text-sky-400" />
                <span>Gebouwd voor bouwbedrijven in België</span>
              </div>

              <h1 className="text-balance text-[2.25rem] font-bold leading-[1.08] tracking-[-0.035em] text-white sm:text-[3rem] lg:text-[3.1rem] xl:text-[3.25rem]">
                Eén professioneel CRM voor bouw:{" "}
                <span className="block text-sky-400">
                  offertes, projecten en facturen.
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-[34rem] text-pretty text-base leading-7 text-slate-300/80 sm:mt-6 sm:text-lg lg:mx-0">
                Werk sneller, mis niets en laat AI je herinneren aan elke
                volgende actie. Van eerste offerte tot betaling, alles verbonden
                in één systeem.
              </p>

              <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <FastLink
                  href="/register"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_50px_-20px_rgba(37,99,235,0.9)] transition-all hover:-translate-y-0.5 hover:bg-blue-500 sm:w-auto sm:px-7"
                >
                  Start 14 dagen gratis
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </FastLink>
                <FastLink
                  href="/dashboard/voorbeeld"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-[#07101d]/70 px-6 py-3.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-sky-300/60 hover:bg-white/[0.06] sm:w-auto sm:px-7"
                >
                  <Play size={15} className="fill-current text-sky-400" />
                  Bekijk demo
                </FastLink>
              </div>

              <ul className="mt-6 flex flex-col items-start gap-2 text-left text-sm text-slate-400 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-5 sm:gap-y-2 lg:justify-start">
                <li className="flex items-center gap-2">
                  <Shield size={15} className="shrink-0 text-sky-400/90" />
                  Geen creditcard vereist
                </li>
                <li className="flex items-center gap-2">
                  <Zap size={15} className="shrink-0 text-sky-400/90" />
                  Setup in 2 minuten
                </li>
                <li className="flex items-center gap-2">
                  <Lock size={15} className="shrink-0 text-sky-400/90" />
                  Annuleer wanneer je wilt
                </li>
              </ul>
          </div>

          <div className="relative flex min-h-0 w-full min-w-0 max-w-full items-center justify-center overflow-hidden lg:min-h-[500px] lg:justify-end lg:overflow-visible xl:min-h-[540px]">
            <HeroDashboard />
          </div>
        </div>
      </div>

      <HeroTrustBar />
    </section>
  );
}
