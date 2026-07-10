"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSpeechEnabled, setSpeechEnabled } from "@/lib/onboarding/storage";
import { speakText, stopSpeech } from "@/lib/speech/speechManager";

export function useDutchSpeech() {
  const [enabled, setEnabled] = useState(() =>
    typeof window === "undefined" ? true : isSpeechEnabled(),
  );
  const pendingRef = useRef(0);

  const stop = useCallback(() => {
    pendingRef.current += 1;
    stopSpeech();
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!enabled || !text.trim()) return;

      const requestId = ++pendingRef.current;
      void (async () => {
        await speakText(text);
        if (requestId !== pendingRef.current) {
          stopSpeech();
        }
      })();
    },
    [enabled],
  );

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      setSpeechEnabled(next);
      if (!next) stop();
      return next;
    });
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { enabled, speak, stop, toggle };
}
