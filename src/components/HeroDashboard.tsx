import Image from "next/image";
import { Sparkles } from "lucide-react";

/** Hero-visual: tablet + smartphone uit het Gemini-ontwerp. */
export default function HeroDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-[640px] lg:max-w-none">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.2),transparent_72%)] blur-3xl lg:-inset-12"
      />

      <Image
        src="/hero-devices-mockup.png"
        alt="ArchonPro dashboard op tablet en smartphone"
        width={1376}
        height={1536}
        priority
        unoptimized
        className="relative h-auto w-full translate-x-1 scale-[1.02] [filter:drop-shadow(0_48px_96px_rgba(0,0,0,0.55))] lg:translate-x-3 lg:scale-[1.06] xl:translate-x-5 xl:scale-[1.08]"
        sizes="(max-width: 1024px) 92vw, 52vw"
      />

      <Sparkles
        aria-hidden
        className="pointer-events-none absolute bottom-2 right-1 text-white/30 sm:right-3"
        size={22}
        strokeWidth={1.5}
      />
    </div>
  );
}
