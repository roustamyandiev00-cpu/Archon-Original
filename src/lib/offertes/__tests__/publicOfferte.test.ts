import { describe, expect, it } from "vitest";
import { isValidPublicOfferteToken } from "@/lib/offertes/publicOfferte";

describe("isValidPublicOfferteToken", () => {
  it("accepteert 32-char hex tokens", () => {
    expect(isValidPublicOfferteToken("a".repeat(32))).toBe(true);
    expect(
      isValidPublicOfferteToken("0123456789abcdef0123456789abcdef"),
    ).toBe(true);
  });

  it("weigert ongeldige tokens", () => {
    expect(isValidPublicOfferteToken("")).toBe(false);
    expect(isValidPublicOfferteToken("short")).toBe(false);
    expect(isValidPublicOfferteToken("g".repeat(32))).toBe(false);
    expect(isValidPublicOfferteToken("../etc/passwd")).toBe(false);
    expect(isValidPublicOfferteToken("a".repeat(31))).toBe(false);
  });
});
