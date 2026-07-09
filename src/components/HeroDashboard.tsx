import Image from "next/image";
import HeroPhone from "@/components/HeroPhone";

/** Mission View dashboard + smartphone-preview voor de hero. */
export default function HeroDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-[720px] overflow-visible lg:max-w-none">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-sky-500/25 via-indigo-500/15 to-cyan-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#9089fc]/20 blur-3xl"
      />

      <div className="relative z-10 overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 shadow-[0_40px_100px_-24px_rgba(0,0,0,0.85)] ring-1 ring-white/5">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />

        <Image
          src="/hero-dashboard-mission-view.png"
          alt="ArchonPro Mission View dashboard — overzicht met offertes, facturen, action items en Nova AI-metgezel"
          width={1920}
          height={1080}
          priority
          className="h-auto w-full"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950/80 to-transparent"
        />
      </div>

      <HeroPhone />
    </div>
  );
}
