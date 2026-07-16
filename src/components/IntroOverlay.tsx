"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { fastButtonClass } from "@/components/FastLink";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "archonpro-intro-seen-v5";
const INTRO_VIDEO_DESKTOP = "/ArchonPro_CRM_logo_intro_premium_16x9.mp4";
const INTRO_VIDEO_MOBILE = "/ArchonPro_CRM_logo_intro_202607080214.mp4";

function markIntroSeen() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, "1");
}

function getIsMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

export default function IntroOverlay({ skipIntro = false }: { skipIntro?: boolean }) {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (skipIntro || typeof window === "undefined") return;

    const supabase = createClient();

    const hideIntro = () => {
      markIntroSeen();
      setLeaving(true);
      document.body.style.overflow = "";
      window.setTimeout(() => setShow(false), 180);
    };

    const maybeShowIntro = async () => {
      if (localStorage.getItem(STORAGE_KEY)) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        markIntroSeen();
        return;
      }

      requestAnimationFrame(() => {
        setIsMobile(getIsMobileViewport());
        setShow(true);
        document.body.style.overflow = "hidden";
      });
    };

    void maybeShowIntro();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        hideIntro();
      }
    });

    return () => subscription.unsubscribe();
  }, [skipIntro]);

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
  }, [show, isMobile]);

  const videoSrc = isMobile ? INTRO_VIDEO_MOBILE : INTRO_VIDEO_DESKTOP;

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted && video.paused) void video.play();
  };

  const dismiss = () => {
    setLeaving(true);
    markIntroSeen();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("archonpro-intro-dismissed"));
    }
    document.body.style.overflow = "";
    window.setTimeout(() => setShow(false), 180);
  };

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-opacity duration-200 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Intro video"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.1),transparent_72%)] blur-3xl ${
            isMobile ? "h-[42vh] w-[72vw]" : "h-[50vh] w-[50vw] max-w-2xl"
          }`}
        />
      </div>

      <video
        key={videoSrc}
        ref={videoRef}
        className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain ${
          isMobile
            ? "aspect-[9/16] w-[min(100vw-1.5rem,22rem)] max-h-[min(100dvh-9rem,82svh)]"
            : "aspect-video w-[min(100vw-2rem,72rem)] max-h-[min(100dvh-8rem,80vh)]"
        }`}
        src={videoSrc}
        autoPlay
        playsInline
        onEnded={dismiss}
        onError={dismiss}
        onClick={(event) => event.stopPropagation()}
      />

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          toggleMute();
        }}
        aria-label={muted ? "Geluid aanzetten" : "Geluid uitzetten"}
        className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/70 text-zinc-200 backdrop-blur-sm transition-colors hover:border-sky-500/50 hover:text-sky-300 sm:right-6 sm:top-6"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      <button
        onClick={(event) => {
          event.stopPropagation();
          dismiss();
        }}
        className={fastButtonClass(
          "group absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-sky-500 px-7 py-3.5 text-sm font-medium text-zinc-950 hover:bg-sky-400 hover:shadow-[0_0_30px_-5px_rgba(56,189,248,0.6)]",
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
