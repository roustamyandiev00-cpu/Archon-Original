import { describe, expect, it } from "vitest";
import { detectContactDetails } from "@/lib/bouwnetwerk/contact-detect";
import {
  analyzeChatMessage,
  suggestedSanctionType,
} from "@/lib/bouwnetwerk/chat-moderation";

describe("detectContactDetails", () => {
  it("finds email and phone", () => {
    const hits = detectContactDetails(
      "Bel me op +32 470 12 34 56 of mail info@bouw.be",
    );
    expect(hits.some((h) => h.kind === "email")).toBe(true);
    expect(hits.some((h) => h.kind === "phone")).toBe(true);
  });

  it("finds whatsapp", () => {
    const hits = detectContactDetails("chat via https://wa.me/32470123456");
    expect(hits.some((h) => h.kind === "whatsapp" || h.kind === "url")).toBe(
      true,
    );
  });

  it("returns empty for clean text", () => {
    expect(detectContactDetails("We kunnen morgen starten op de werf.")).toEqual(
      [],
    );
  });
});

describe("analyzeChatMessage", () => {
  it("flags insults", () => {
    const f = analyzeChatMessage("Jij bent een idioot");
    expect(f.some((x) => x.category === "belediging")).toBe(true);
  });

  it("suggests temporary suspension for threats", () => {
    const f = analyzeChatMessage("Ik zal je doodslaan");
    expect(suggestedSanctionType(f)).toBe("schorsing_tijdelijk");
  });
});
