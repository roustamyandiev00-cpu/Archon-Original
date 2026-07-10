/**
 * Globale spraakmanager — voorkomt dubbele audio en stemwissels.
 * Slechts één zin tegelijk, vaste ElevenLabs-stem via /api/tts.
 */

let generation = 0;
let abortController: AbortController | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
let lastText = "";
let lastSpokenAt = 0;

const DEDUPE_MS = 800;

function revokeObjectUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

export function stopSpeech() {
  generation += 1;
  abortController?.abort();
  abortController = null;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeAttribute("src");
    currentAudio.load();
    currentAudio = null;
  }

  revokeObjectUrl();
}

export async function speakText(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || typeof window === "undefined") return;

  const now = Date.now();
  if (trimmed === lastText && now - lastSpokenAt < DEDUPE_MS) {
    return;
  }

  lastText = trimmed;
  lastSpokenAt = now;

  stopSpeech();

  const myGeneration = generation;
  const controller = new AbortController();
  abortController = controller;

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
      signal: controller.signal,
    });

    if (!response.ok || myGeneration !== generation) return;

    const blob = await response.blob();
    if (myGeneration !== generation) return;

    const url = URL.createObjectURL(blob);
    currentObjectUrl = url;

    const audio = new Audio(url);
    currentAudio = audio;

    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Audio playback failed"));
      void audio.play().catch(reject);
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    if (error instanceof Error && error.name === "AbortError") return;
    console.error("speakText:", error);
  } finally {
    if (myGeneration === generation) {
      revokeObjectUrl();
      currentAudio = null;
    }
  }
}
