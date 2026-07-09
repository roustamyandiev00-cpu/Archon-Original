import Image from "next/image";

/** Smartphone-mockup in Renalto-stijl: gekanteld in de voorgrond. */
export default function HeroPhone() {
  return (
    <div className="pointer-events-none absolute -bottom-10 -right-2 z-30 hidden w-[200px] sm:block md:-bottom-12 md:-right-4 md:w-[230px] lg:-bottom-14 lg:-right-6 lg:w-[260px]">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[3rem] bg-sky-500/25 blur-3xl"
      />

      <div
        className="relative origin-bottom-right"
        style={{
          transform: "perspective(1400px) rotateY(-14deg) rotateX(4deg) rotateZ(6deg)",
        }}
      >
        <div className="absolute -bottom-3 left-1/2 h-6 w-[72%] -translate-x-1/2 rounded-[100%] bg-black/45 blur-xl" />

        <div className="relative rounded-[2.35rem] border border-white/25 bg-gradient-to-b from-zinc-800 to-zinc-950 p-[9px] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.06)] ring-1 ring-sky-500/20">
          <div className="relative overflow-hidden rounded-[1.85rem] bg-zinc-950">
            <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2.5">
              <div className="h-5 w-[84px] rounded-full bg-zinc-950 ring-1 ring-white/10" />
            </div>

            <Image
              src="/hero-app-mobile-preview.png"
              alt="ArchonPro app op smartphone — Nova AI, action items en KPI's"
              width={390}
              height={844}
              className="h-auto w-full"
              sizes="260px"
            />

            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/[0.04]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
