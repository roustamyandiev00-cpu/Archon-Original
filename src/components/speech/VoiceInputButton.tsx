"use client";

import { Mic, MicOff } from "lucide-react";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { speechSupportMessage } from "@/lib/speech/speechRecognition";

type VoiceInputButtonProps = {
  onTranscript: (text: string) => void;
  label?: string;
  listeningLabel?: string;
  className?: string;
  variant?: "sky" | "violet" | "orange" | "zinc";
  size?: "sm" | "md";
};

const variantClass: Record<NonNullable<VoiceInputButtonProps["variant"]>, string> =
  {
    sky: "border-sky-500/35 bg-sky-500/10 text-sky-200 hover:border-sky-400/45 hover:bg-sky-500/15",
    violet:
      "border-violet-500/35 bg-violet-500/10 text-violet-200 hover:border-violet-400/45 hover:bg-violet-500/15",
    orange:
      "border-orange-500/35 bg-orange-500/10 text-orange-200 hover:border-orange-400/45 hover:bg-orange-500/15",
    zinc: "border-white/15 bg-white/[0.04] text-zinc-200 hover:border-white/25 hover:bg-white/[0.07]",
  };

export default function VoiceInputButton({
  onTranscript,
  label = "Spreek je antwoord",
  listeningLabel = "Luisteren… houd spatie ingedrukt",
  className = "",
  variant = "sky",
  size = "md",
}: VoiceInputButtonProps) {
  const { isListening, supported, supportReason, error, toggle } =
    useSpeechInput({
      onFinal: onTranscript,
      spaceKey: true,
    });

  const sizeClass =
    size === "sm"
      ? "px-3 py-2 text-xs gap-1.5"
      : "px-4 py-2.5 text-sm gap-2";

  // Tijdens SSR/hydratatie nog geen oordeel — voorkomt "niet beschikbaar"-flits
  if (supportReason === "ssr") {
    return null;
  }

  if (!supported) {
    const message =
      error ??
      speechSupportMessage(supportReason) ??
      "Spraakinvoer niet beschikbaar in deze browser.";
    return (
      <p
        className={`rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-500 ${className}`}
        role="status"
      >
        {message}
      </p>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={isListening}
        aria-label={isListening ? listeningLabel : label}
        className={`inline-flex w-full items-center justify-center rounded-xl border font-medium transition-all touch-manipulation ${sizeClass} ${
          isListening
            ? "border-rose-500/50 bg-rose-500/15 text-rose-200 animate-pulse"
            : variantClass[variant]
        }`}
      >
        {isListening ? (
          <MicOff size={size === "sm" ? 14 : 16} />
        ) : (
          <Mic size={size === "sm" ? 14 : 16} />
        )}
        {isListening ? listeningLabel : `${label} (of spatie)`}
      </button>
      {error ? (
        <p className="mt-1.5 text-[11px] text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
