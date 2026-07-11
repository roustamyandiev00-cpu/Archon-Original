import Image from "next/image";

/** iPhone-mockup (WaveSpeed, transparante achtergrond) — zweeft voor het dashboard. */
export default function HeroPhone() {
  return (
    <div className="pointer-events-none absolute -bottom-14 -right-4 z-30 hidden w-[210px] sm:block md:-bottom-16 md:-right-6 md:w-[240px] lg:-bottom-[4.5rem] lg:-right-10 lg:w-[270px]">
      <div
        className="relative origin-bottom-right"
        style={{
          transform: "perspective(1400px) rotateY(-10deg) rotateX(2deg) rotateZ(4deg)",
        }}
      >
        <Image
          src="/hero-iphone-mockup.png"
          alt="ArchonPro app op iPhone — Lima AI, action items en KPI's"
          width={768}
          height={1376}
          className="h-auto w-full [filter:drop-shadow(0_22px_44px_rgba(0,0,0,0.42))_drop-shadow(0_0_36px_rgba(56,189,248,0.14))]"
          sizes="270px"
        />
      </div>
    </div>
  );
}
