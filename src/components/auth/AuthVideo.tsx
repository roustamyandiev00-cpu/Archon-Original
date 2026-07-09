"use client";

import { useState } from "react";
import { Play } from "lucide-react";

type AuthVideoProps = {
  fallback: React.ReactNode;
  src?: string;
  poster?: string;
  aspect?: "portrait" | "landscape";
};

/**
 * Demovideo in preview-paneel. Speelt automatisch (gedempt, in lus).
 * Bij laadfout: fallback-kaart.
 */
export default function AuthVideo({
  fallback,
  src = "/ArchonPro_CRM_logo_intro_premium_16x9.mp4",
  poster,
  aspect = "landscape",
}: AuthVideoProps) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  if (failed) return <>{fallback}</>;

  const aspectClass =
    aspect === "portrait"
      ? "aspect-[9/16] sm:aspect-[2/3]"
      : "aspect-video";

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 p-2 shadow-2xl shadow-sky-500/10 backdrop-blur-xl">
      {!ready && (
        <div
          className={`${aspectClass} flex items-center justify-center rounded-2xl bg-zinc-950/80`}
        >
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500/30 border-t-sky-400" />
        </div>
      )}
      <video
        className={`${aspectClass} w-full rounded-2xl object-cover ${ready ? "" : "absolute inset-2 opacity-0"}`}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      {ready && (
        <span className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-zinc-100 backdrop-blur">
          <Play size={11} className="fill-current" /> Zie ArchonPro in actie
        </span>
      )}
    </div>
  );
}
