"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/**
 * Toont een korte demovideo in het auth-preview paneel. Zodra het bestand
 * `public/demo.mp4` bestaat, speelt die automatisch (gedempt, in lus). Ontbreekt
 * de video of faalt het laden, dan valt hij terug op de meegegeven kaart.
 */
export default function AuthVideo({
  fallback,
  src = "/demo.mp4",
  poster,
}: {
  fallback: React.ReactNode;
  src?: string;
  poster?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 p-2 shadow-2xl shadow-sky-500/10 backdrop-blur-xl">
      <video
        className="aspect-[9/16] w-full rounded-2xl object-cover sm:aspect-video"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
      />
      <span className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-zinc-100 backdrop-blur">
        <Play size={11} className="fill-current" /> Zie ArchonPro in actie
      </span>
    </div>
  );
}
