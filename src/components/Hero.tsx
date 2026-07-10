import {
  ArrowRight,
  Gift,
  MessageCircle,
  Play,
  Shield,
  Zap,
  Lock,
  Sparkles,
} from "lucide-react";
import HeroDashboard from "@/components/HeroDashboard";
import HeroTrustBar from "@/components/HeroTrustBar";
import { FastLink } from "@/components/FastLink";
import { REFERRAL_REWARDS } from "@/components/ReferralProgram";

export default function Hero() {
  return (
    <section className="relative flex min-h-svh w-full flex-col overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-[#04080f]" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_72%_38%,rgba(14,165,233,0.2),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#060b14] via-[#050a12] to-[#03060c]"
      />
      <div aria-hidden className="hero-pane-grid opacity-55" />

      <div className="relative z-10 flex flex-1 flex-col pt-[5.25rem] sm:pt-[5.75rem] lg:pt-[6rem]">
        <div className="mx-auto grid w-full max-w-7xl xl:max-w-[85rem] flex-1 items-center gap-10 px-6 pb-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-6 lg:px-8 lg:pb-10 xl:gap-10">
          <div className="max-w-xl text-center lg:max-w-[34rem] lg:text-left xl:max-w-[36rem]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/[0.08] px-4 py-1.5 text-xs font-medium text-sky-300">
              <Sparkles size={13} className="text-sky-400" />
              Gebouwd voor bouwbedrijven in België
            </div>

            <h1 className="text-[2.1rem] font-bold leading-[1.08] tracking-tight text-white sm:text-[2.65rem] lg:text-[2.85rem] xl:text-[3.1rem]">
              Eén professioneel CRM voor bouw: offertes, projecten{" "}
              <span className="bg-gradient-to-r from-sky-300 via-sky-400 to-cyan-400 bg-clip-text text-transparent">
                en facturen.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-zinc-400 sm:text-[1.05rem] lg:mx-0">
              Maak sneller offertes, volg werven op, stuur facturen en laat AI
              je herinneren aan elke volgende actie.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <FastLink
                href="/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_32px_-6px_rgba(14,165,233,0.55)] transition-all hover:bg-sky-400 hover:shadow-[0_0_40px_-4px_rgba(14,165,233,0.65)] sm:w-auto"
              >
                Start 14 dagen gratis
                <ArrowRight
                  size={16}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </FastLink>
              <FastLink
                href="/dashboard/voorbeeld"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-white/30 hover:bg-white/[0.06] sm:w-auto"
              >
                <Play size={15} className="fill-current text-sky-400" />
                Bekijk demo
              </FastLink>
            </div>

            <ul className="mt-8 flex flex-col items-center gap-2.5 text-sm text-zinc-500 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start lg:gap-x-7 lg:gap-y-2">
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

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left backdrop-blur-sm">
                <p className="text-sm leading-relaxed text-zinc-400">
                  We bouwen ArchonPro{" "}
                  <span className="font-medium text-zinc-200">
                    samen met vakmensen zoals jij
                  </span>
                  . Heb je feedback, een idee of gewoon iets dat je wilt delen?
                  Jouw mening helpt ons beter worden.
                </p>
                <FastLink
                  href="/gemeenschap"
                  className="group mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-500/35 bg-sky-500/10 px-5 py-3 text-sm font-semibold text-sky-300 transition-all hover:border-sky-400/45 hover:bg-sky-500/15 hover:text-sky-200"
                >
                  <MessageCircle size={16} className="shrink-0" />
                  Deel je mening
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </FastLink>
              </div>

              <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] via-white/[0.02] to-sky-500/[0.06] p-5 text-left backdrop-blur-sm">
                <p className="text-sm leading-relaxed text-zinc-400">
                  Ken je collega&apos;s die nog met Excel werken?{" "}
                  <span className="font-medium text-zinc-200">
                    Nodig vrienden uit
                  </span>{" "}
                  en ontvang je eigen code (initialen + cijfers). Zij krijgen{" "}
                  <span className="font-medium text-violet-200">
                    {REFERRAL_REWARDS.invitee}
                  </span>
                  .
                </p>
                <FastLink
                  href="/register"
                  className="group mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-violet-500/35 bg-violet-500/10 px-5 py-3 text-sm font-semibold text-violet-200 transition-all hover:border-violet-400/45 hover:bg-violet-500/15 hover:text-violet-100"
                >
                  <Gift size={16} className="shrink-0" />
                  Nodig vrienden uit
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                </FastLink>
              </div>
            </div>
          </div>

          <div className="relative flex min-h-[280px] items-center justify-center sm:min-h-[340px] lg:min-h-[480px] lg:justify-end">
            <HeroDashboard />
          </div>
        </div>
      </div>

      <HeroTrustBar />
    </section>
  );
}
