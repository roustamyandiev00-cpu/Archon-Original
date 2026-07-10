"use client";

import { Mic, MicOff } from "lucide-react";
import { useSpeechInput } from "@/hooks/useSpeechInput";

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
  const { isListening, supported, toggle } = useSpeechInput({
    onFinal: onTranscript,
    spaceKey: true,
  });

  if (!supported) return null;

  const sizeClass =
    size === "sm"
      ? "px-3 py-2 text-xs gap-1.5"
      : "px-4 py-2.5 text-sm gap-2";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isListening}
      aria-label={isListening ? listeningLabel : label}
      className={`inline-flex w-full items-center justify-center rounded-xl border font-medium transition-all ${sizeClass} ${
        isListening
          ? "border-rose-500/50 bg-rose-500/15 text-rose-200 animate-pulse"
          : variantClass[variant]
      } ${className}`}
    >
      {isListening ? <MicOff size={size === "sm" ? 14 : 16} /> : <Mic size={size === "sm" ? 14 : 16} />}
      {isListening ? listeningLabel : `${label} (of spatie)`}
    </button>
  );
}
