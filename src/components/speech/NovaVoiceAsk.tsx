"use client";

import { useState } from "react";
import VoiceInputButton from "@/components/speech/VoiceInputButton";
import { useDutchSpeech } from "@/hooks/useDutchSpeech";
import { answerNovaTourQuestion } from "@/lib/onboarding/voice-answers";

type NovaVoiceAskProps = {
  stepTitle?: string;
  stepText?: string;
  variant?: "sky" | "orange";
  /** Dashboard: stuur vraag naar Ela-chat i.p.v. lokaal antwoord. */
  onAskChat?: (question: string) => void;
};

export default function NovaVoiceAsk({
  stepTitle,
  stepText,
  variant = "sky",
  onAskChat,
}: NovaVoiceAskProps) {
  const { speak } = useDutchSpeech();
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  function handleQuestion(text: string) {
    setQuestion(text);

    if (onAskChat) {
      onAskChat(text);
      setAnswer("Ik open Ela-chat met je vraag — even geduld.");
      return;
    }

    const reply = answerNovaTourQuestion(text, { stepTitle, stepText });
    setAnswer(reply);
    speak(reply);
  }

  return (
    <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
      <VoiceInputButton
        variant={variant}
        size="sm"
        label="Ik snap het niet — spreek je vraag"
        listeningLabel="Luisteren…"
        onTranscript={handleQuestion}
      />

      {question && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs leading-relaxed text-zinc-400">
          <span className="font-medium text-zinc-300">Jij:</span> {question}
        </div>
      )}

      {answer && (
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.06] px-3 py-2.5 text-xs leading-relaxed text-sky-100/90">
          <span className="font-medium text-sky-300">Ela:</span> {answer}
        </div>
      )}
    </div>
  );
}
