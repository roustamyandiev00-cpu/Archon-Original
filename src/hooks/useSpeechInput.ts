"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSpeechRecognition,
  ensureMicrophonePermission,
  getSpeechSupportReason,
  speechSupportMessage,
  type SpeechRecognitionInstance,
  type SpeechSupportReason,
} from "@/lib/speech/speechRecognition";

type UseSpeechInputOptions = {
  lang?: string;
  continuous?: boolean;
  /** Spatie: ingedrukt houden = opnemen, loslaten = stoppen. */
  spaceKey?: boolean;
  /** Wordt aangeroepen wanneer een fragment herkend is (inclusief interim). */
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

function isIgnorableSpeechError(error: string): boolean {
  return error === "no-speech" || error === "aborted";
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
  const [supportReason, setSupportReason] =
    useState<SpeechSupportReason>("ssr");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalBufferRef = useRef("");
  const interimRef = useRef("");
  const handlersRef = useRef({ onResult, onFinal });
  const wantListeningRef = useRef(false);
  const isListeningRef = useRef(false);
  const spaceHeldRef = useRef(false);
  const startSessionRef = useRef(0);
  const primingRef = useRef<Promise<"granted" | "denied" | "unavailable"> | null>(
    null,
  );

  useEffect(() => {
    handlersRef.current = { onResult, onFinal };
  }, [onResult, onFinal]);

  const emitCombined = useCallback(() => {
    const finalPart = finalBufferRef.current.trim();
    const interimPart = interimRef.current.trim();
    const combined = [finalPart, interimPart].filter(Boolean).join(" ").trim();
    if (combined) handlersRef.current.onResult?.(combined);
  }, []);

  useEffect(() => {
    const reason = getSpeechSupportReason();
    queueMicrotask(() => {
      setSupportReason(reason);
      setSupported(reason === "ok");
    });

    const recognition = createSpeechRecognition();
    if (!recognition) return;

    // continuous=false + herstart terwijl wantListening = stabieler op iOS/Android
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result?.[0]?.transcript ?? "";
        if (!text) continue;
        if (result.isFinal) {
          finalBufferRef.current = finalBufferRef.current
            ? `${finalBufferRef.current} ${text.trim()}`
            : text.trim();
        } else {
          interim += text;
        }
      }
      interimRef.current = interim;
      emitCombined();
    };

    recognition.onend = () => {
      interimRef.current = "";

      if (wantListeningRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          return;
        } catch {
          wantListeningRef.current = false;
          setError("Spraakinvoer kon niet opnieuw starten. Probeer opnieuw.");
        }
      }

      setIsListening(false);
      isListeningRef.current = false;
      const finalText = finalBufferRef.current.trim();
      finalBufferRef.current = "";
      if (finalText) handlersRef.current.onFinal?.(finalText);
    };

    recognition.onerror = (event) => {
      const code = event.error || "unknown";

      if (isIgnorableSpeechError(code) && wantListeningRef.current) {
        return;
      }

      if (code === "not-allowed" || code === "service-not-allowed") {
        wantListeningRef.current = false;
        setError(
          "Microfoontoegang geblokkeerd. Sta de microfoon toe in je browserinstellingen.",
        );
      } else if (code === "network") {
        setError("Spraakherkenning heeft netwerk nodig. Controleer je verbinding.");
      } else if (!isIgnorableSpeechError(code)) {
        setError("Spraakinvoer mislukt. Probeer opnieuw.");
      }

      if (!isIgnorableSpeechError(code)) {
        wantListeningRef.current = false;
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      wantListeningRef.current = false;
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onstart = null;
      try {
        recognition.abort();
      } catch {
        /* browser kan al gestopt zijn */
      }
      recognitionRef.current = null;
    };
  }, [continuous, lang, emitCombined]);

  const stop = useCallback(() => {
    startSessionRef.current += 1;
    wantListeningRef.current = false;
    spaceHeldRef.current = false;
    const recognition = recognitionRef.current;
    if (!recognition) {
      setIsListening(false);
      isListeningRef.current = false;
      return;
    }
    try {
      recognition.stop();
    } catch {
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);

    const reason = getSpeechSupportReason();
    if (reason !== "ok") {
      setSupportReason(reason);
      setSupported(false);
      setError(speechSupportMessage(reason));
      return;
    }

    const recognition = recognitionRef.current;
    if (!recognition || wantListeningRef.current) return;

    const session = ++startSessionRef.current;
    wantListeningRef.current = true;

    if (!primingRef.current) {
      primingRef.current = ensureMicrophonePermission();
    }
    const permission = await primingRef.current;

    // Gebruiker liet los / stopte tijdens de permissiedialoog
    if (session !== startSessionRef.current || !wantListeningRef.current) {
      return;
    }

    if (permission === "denied") {
      primingRef.current = null;
      wantListeningRef.current = false;
      setError(
        "Microfoontoegang geblokkeerd. Sta de microfoon toe en probeer opnieuw.",
      );
      return;
    }

    finalBufferRef.current = "";
    interimRef.current = "";

    try {
      recognition.start();
    } catch {
      wantListeningRef.current = false;
      setIsListening(false);
      isListeningRef.current = false;
      setError("Spraakinvoer kon niet starten. Probeer opnieuw.");
    }
  }, []);

  const toggle = useCallback(() => {
    if (wantListeningRef.current || isListeningRef.current) stop();
    else void start();
  }, [start, stop]);

  const clearError = useCallback(() => setError(null), []);

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
      if (!wantListeningRef.current) void start();
    }

    function onKeyUp(event: KeyboardEvent) {
      if (!isSpace(event)) return;
      if (!spaceHeldRef.current) return;
      spaceHeldRef.current = false;
      if (wantListeningRef.current) stop();
    }

    function onBlur() {
      spaceHeldRef.current = false;
      if (wantListeningRef.current) stop();
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
    supportReason,
    error,
    clearError,
    start,
    stop,
    toggle,
  };
}
