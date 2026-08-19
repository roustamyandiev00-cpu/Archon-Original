import Image from "next/image";

export default function HeroDashboard() {
  return (
    <div className="relative flex h-full w-full min-w-0 max-w-full items-center justify-center lg:justify-end">
      <div className="relative z-10 w-full min-w-0 max-w-[52rem] origin-center">
        <Image
          src="/hero-command-center-dashboard.webp"
          alt="ArchonPro Command Center met AI-agents, offertes, facturen en opvolging"
          width={1322}
          height={864}
          priority
          sizes="(min-width: 1280px) 52rem, (min-width: 1024px) 58vw, 0px"
          className="h-auto w-full rounded-[1.25rem] object-contain shadow-[0_28px_80px_-36px_rgba(14,165,233,0.65)]"
        />
      </div>
    </div>
  );
}
