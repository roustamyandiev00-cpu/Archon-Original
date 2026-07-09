import Image from "next/image";

export default function HeroDashboard() {
  return (
    <div className="relative flex h-full w-full max-w-[44rem] items-center justify-center lg:max-w-none lg:justify-end">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[85%] w-[90%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.28),transparent_68%)] lg:left-[58%]"
      />

      <div className="relative z-10 w-full max-w-[42rem] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_32px_80px_rgba(14,165,233,0.32)] sm:max-w-[48rem] lg:max-h-[min(80vh,760px)] lg:max-w-full lg:translate-x-4 xl:translate-x-8">
        <Image
          src="/hero-dashboard-screen.png"
          alt="ArchonPro dashboard — overzicht met offertes, facturen en AI-agents"
          width={1440}
          height={732}
          priority
          className="h-auto w-full object-cover object-left-top"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 64rem"
        />
      </div>
    </div>
  );
}
