"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { fastButtonClass } from "@/components/FastLink";

const STORAGE_KEY = "archonpro-intro-seen-v4";
const INTRO_VIDEO = "/ArchonPro_CRM_logo_intro_premium_16x9.mp4";

export default function IntroOverlay() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (!seen) {
      requestAnimationFrame(() => {
        setShow(true);
        document.body.style.overflow = "hidden";
      });
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    const video = videoRef.current;
    if (!video) return;

    video.volume = 0.85;
    video.muted = false;

    const playWithSound = async () => {
      try {
        await video.play();
        setMuted(false);
      } catch {
        video.muted = true;
        setMuted(true);
        await video.play();
      }
    };

    void playWithSound();
  }, [show]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted && video.paused) void video.play();
  };

  const dismiss = () => {
    setLeaving(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, "1");
    }
    document.body.style.overflow = "";
    window.setTimeout(() => setShow(false), 180);
  };

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 transition-opacity duration-200 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/2 h-[70vh] w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18),rgba(144,137,252,0.12),transparent_70%)] blur-3xl" />
      </div>

      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain object-center"
        src={INTRO_VIDEO}
        autoPlay
        playsInline
        onEnded={dismiss}
        onError={dismiss}
      />

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Geluid aanzetten" : "Geluid uitzetten"}
        className="absolute right-6 top-6 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/70 text-zinc-200 backdrop-blur-sm transition-colors hover:border-sky-500/50 hover:text-sky-300"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      <button
        onClick={dismiss}
        className={fastButtonClass(
          "group absolute bottom-12 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-sky-500 px-7 py-3 text-sm font-medium text-zinc-950 hover:bg-sky-400 hover:shadow-[0_0_30px_-5px_rgba(56,189,248,0.6)]",
        )}
      >
        Verder gaan
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </button>
    </div>
  );
}
