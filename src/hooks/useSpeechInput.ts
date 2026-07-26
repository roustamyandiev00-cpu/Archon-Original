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
  /** Spatie: ingedrukt houden = opnemen, loslaten = stoppen. */
  spaceKey?: boolean;
  /** Wordt aangeroepen wanneer een fragment herkend is. */
  onResult?: (text: string) => void;
  /** Wordt aangeroepen wanneer de opname stopt (finale transcript). */
  onFinal?: (text: string) => void;
};

function canUseSpaceForMic(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "SELECT") return false;
  if (target.isContentEditable) return false;
  if (tag === "TEXTAREA") {
    return (target as HTMLTextAreaElement).value.trim() === "";
  }
  return true;
}

export function useSpeechInput(options: UseSpeechInputOptions = {}) {
  const {
    lang = "nl-NL",
    continuous = false,
    spaceKey = false,
    onResult,
    onFinal,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const bufferRef = useRef("");
  const handlersRef = useRef({ onResult, onFinal });
  const isListeningRef = useRef(false);
  const spaceHeldRef = useRef(false);

  useEffect(() => {
    handlersRef.current = { onResult, onFinal };
  }, [onResult, onFinal]);

  useEffect(() => {
    queueMicrotask(() => {
      setSupported(isSpeechRecognitionSupported());
    });
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
      isListeningRef.current = false;
      const finalText = bufferRef.current.trim();
      bufferRef.current = "";
      if (finalText) handlersRef.current.onFinal?.(finalText);
    };

    recognition.onerror = () => {
      setIsListening(false);
      isListeningRef.current = false;
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
      isListeningRef.current = false;
    }
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || isListeningRef.current) return;
    bufferRef.current = "";
    try {
      recognition.start();
      setIsListening(true);
      isListeningRef.current = true;
    } catch {
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, []);

  const toggle = useCallback(() => {
    if (isListeningRef.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => {
    if (!spaceKey || !supported) return;

    function isSpace(event: KeyboardEvent) {
      return event.key === " " || event.code === "Space";
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!isSpace(event) || event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (!canUseSpaceForMic(event.target)) return;

      event.preventDefault();
      spaceHeldRef.current = true;
      if (!isListeningRef.current) start();
    }

    function onKeyUp(event: KeyboardEvent) {
      if (!isSpace(event)) return;
      if (!spaceHeldRef.current) return;
      spaceHeldRef.current = false;
      if (isListeningRef.current) stop();
    }

    function onBlur() {
      spaceHeldRef.current = false;
      if (isListeningRef.current) stop();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [spaceKey, supported, start, stop]);

  return {
    isListening,
    supported,
    start,
    stop,
    toggle,
  };
}
