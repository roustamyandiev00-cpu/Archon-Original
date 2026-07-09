import Image from "next/image";

export default function DraggablePhoneVisual() {
  return (
    <div className="relative mx-auto flex w-full max-w-[min(100%,38rem)] justify-center sm:max-w-[42rem] lg:max-w-none lg:justify-end lg:-mr-6 xl:max-w-[52rem] 2xl:max-w-[56rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[95%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/25 blur-3xl"
      />

      <Image
        src="/bouwnetwerk-comms-phone.png"
        alt="ArchonPro chat op de werf — direct verder praten na een match in het bouwnetwerk"
        width={900}
        height={1200}
        priority
        className="relative z-10 w-full max-w-[36rem] drop-shadow-[0_32px_100px_rgba(14,165,233,0.35)] sm:max-w-[40rem] lg:max-w-[46rem] xl:max-w-[52rem] 2xl:max-w-[56rem]"
      />
    </div>
  );
}
