"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  type SpeechRecognitionInstance,
} from "@/lib/speech/speechRecognition";

type UseSpeechInputOptions = {
  lang?: string;
  continuous?: boolean;
  /** Wordt aangeroepen wanneer een fragment herkend is. */
  onResult?: (text: string) => void;
  /** Wordt aangeroepen wanneer de opname stopt (finale transcript). */
  onFinal?: (text: string) => void;
};

export function useSpeechInput(options: UseSpeechInputOptions = {}) {
  const {
    lang = "nl-NL",
    continuous = false,
    onResult,
    onFinal,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const bufferRef = useRef("");
  const handlersRef = useRef({ onResult, onFinal });

  useEffect(() => {
    handlersRef.current = { onResult, onFinal };
  }, [onResult, onFinal]);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
    const recognition = createSpeechRecognition();
    if (!recognition) return;

    recognition.continuous = continuous;
    recognition.interimResults = false;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]?.[0];
      const text = result?.transcript?.trim();
      if (!text) return;

      if (continuous) {
        bufferRef.current = bufferRef.current
          ? `${bufferRef.current} ${text}`
          : text;
        handlersRef.current.onResult?.(bufferRef.current);
      } else {
        bufferRef.current = text;
        handlersRef.current.onResult?.(text);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalText = bufferRef.current.trim();
      bufferRef.current = "";
      if (finalText) handlersRef.current.onFinal?.(finalText);
    };

    recognition.onerror = () => {
      setIsListening(false);
      bufferRef.current = "";
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      try {
        recognition.abort();
      } catch {
        /* browser kan al gestopt zijn */
      }
      recognitionRef.current = null;
    };
  }, [continuous, lang]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      setIsListening(false);
    }
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || isListening) return;
    bufferRef.current = "";
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [isListening]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  return {
    isListening,
    supported,
    start,
    stop,
    toggle,
  };
}
