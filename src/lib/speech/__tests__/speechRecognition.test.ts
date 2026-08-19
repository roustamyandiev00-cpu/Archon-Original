import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSpeechRecognition,
  getSpeechSupportReason,
  isSpeechRecognitionSupported,
  speechSupportMessage,
} from "@/lib/speech/speechRecognition";

describe("speechRecognition support helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("meldt ssr buiten de browser", () => {
    expect(getSpeechSupportReason()).toBe("ssr");
    expect(speechSupportMessage("ssr")).toBeNull();
    expect(isSpeechRecognitionSupported()).toBe(false);
    expect(createSpeechRecognition()).toBeNull();
  });

  it("geeft duidelijke berichten voor unsupported en insecure", () => {
    expect(speechSupportMessage("unsupported")).toMatch(/browser/i);
    expect(speechSupportMessage("insecure-context")).toMatch(/HTTPS/i);
    expect(speechSupportMessage("ok")).toBeNull();
  });

  it("herkent insecure context in een stubbed window", () => {
    class FakeRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      onresult = null;
      onend = null;
      onerror = null;
      onstart = null;
      start() {}
      stop() {}
      abort() {}
    }

    vi.stubGlobal("window", {
      isSecureContext: false,
      SpeechRecognition: FakeRecognition,
      webkitSpeechRecognition: undefined,
    });

    expect(getSpeechSupportReason()).toBe("insecure-context");
    expect(isSpeechRecognitionSupported()).toBe(false);
    expect(createSpeechRecognition()).toBeNull();
  });

  it("maakt een recognition-instance in secure context", () => {
    class FakeRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      onresult = null;
      onend = null;
      onerror = null;
      onstart = null;
      start() {}
      stop() {}
      abort() {}
    }

    vi.stubGlobal("window", {
      isSecureContext: true,
      SpeechRecognition: FakeRecognition,
      webkitSpeechRecognition: undefined,
    });

    expect(getSpeechSupportReason()).toBe("ok");
    expect(isSpeechRecognitionSupported()).toBe(true);
    expect(createSpeechRecognition()).toBeInstanceOf(FakeRecognition);
  });
});
