export type SpeechRecognitionResultEvent = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
      };
    };
  };
};

export type SpeechRecognitionErrorEvent = Event & {
  error: string;
  message?: string;
};

export type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

export type SpeechSupportReason =
  | "ok"
  | "ssr"
  | "insecure-context"
  | "unsupported";

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as SpeechRecognitionWindow;
  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
}

export function getSpeechSupportReason(): SpeechSupportReason {
  if (typeof window === "undefined") return "ssr";
  if (!window.isSecureContext) return "insecure-context";
  if (!getSpeechRecognitionConstructor()) return "unsupported";
  return "ok";
}

export function createSpeechRecognition(): SpeechRecognitionInstance | null {
  const Constructor = getSpeechRecognitionConstructor();
  if (!Constructor) return null;
  if (typeof window !== "undefined" && !window.isSecureContext) return null;
  return new Constructor();
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechSupportReason() === "ok";
}

export function speechSupportMessage(reason: SpeechSupportReason): string | null {
  switch (reason) {
    case "insecure-context":
      return "Spraak werkt alleen via HTTPS (of localhost), niet via HTTP op het netwerk.";
    case "unsupported":
      return "Deze browser ondersteunt geen spraakinvoer. Gebruik Chrome of Edge (desktop/Android), of Safari 14.5+.";
    case "ssr":
    case "ok":
      return null;
  }
}

/** Vraagt eenmalig microfoontoegang; helpt Safari/iOS om SpeechRecognition te ontgrendelen. */
export async function ensureMicrophonePermission(): Promise<
  "granted" | "denied" | "unavailable"
> {
  if (typeof navigator === "undefined") return "unavailable";
  if (!window.isSecureContext) return "denied";

  const mediaDevices = navigator.mediaDevices;
  if (!mediaDevices?.getUserMedia) return "unavailable";

  try {
    const stream = await mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) track.stop();
    return "granted";
  } catch {
    return "denied";
  }
}
