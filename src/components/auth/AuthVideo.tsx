"use client";

import { useState, useEffect } from "react";
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
  src = "/ArchonPro_CRM_logo_intro_202607080214.mp4",
  poster,
  aspect = "portrait",
}: AuthVideoProps) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // If video fails to load or play within 2.5s, switch to static preview card
    const timer = setTimeout(() => {
      if (!ready) {
        console.warn("Video load timeout. Using fallback static card.");
        setFailed(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [ready]);

  if (failed) return <>{fallback}</>;

  const isPortrait = aspect === "portrait";

  return (
    <div
      className={`relative flex h-full w-full max-w-none items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 p-2 shadow-2xl shadow-sky-500/10 backdrop-blur-xl ${
        isPortrait
          ? "max-h-full max-w-[min(100%,20rem)] xl:max-w-[24rem] 2xl:max-w-[28rem]"
          : "max-w-full"
      }`}
    >
      {!ready && (
        <div
          className={`flex w-full items-center justify-center rounded-xl bg-zinc-950/80 ${
            isPortrait ? "aspect-[9/16] max-h-full" : "aspect-video"
          }`}
        >
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-sky-500/30 border-t-sky-400" />
        </div>
      )}
      <video
        className={`w-full rounded-xl bg-zinc-950 ${isPortrait ? "max-h-full object-contain" : "aspect-video object-cover"} ${ready ? "" : "absolute inset-1.5 opacity-0"}`}
        style={
          isPortrait
            ? { aspectRatio: "9/16", maxHeight: "min(100%, calc(100svh - 9.5rem))" }
            : { maxHeight: "min(100%, calc(100svh - 13rem))" }
        }
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
        <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-medium text-zinc-100 backdrop-blur">
          <Play size={10} className="fill-current" /> Zie ArchonPro in actie
        </span>
      )}
    </div>
  );
}
