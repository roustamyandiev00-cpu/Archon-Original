import { afterEach, describe, expect, it } from "vitest";
import {
  decryptSecret,
  encryptSecret,
  isEncryptedSecret,
} from "@/lib/crypto/secrets";

describe("secrets crypto", () => {
  const prev = process.env.SECRETS_ENCRYPTION_KEY;

  afterEach(() => {
    if (prev === undefined) delete process.env.SECRETS_ENCRYPTION_KEY;
    else process.env.SECRETS_ENCRYPTION_KEY = prev;
  });

  it("leaves plaintext when no key is set", () => {
    delete process.env.SECRETS_ENCRYPTION_KEY;
    expect(encryptSecret("app-password")).toBe("app-password");
    expect(decryptSecret("app-password")).toBe("app-password");
  });

  it("round-trips with a passphrase key", () => {
    process.env.SECRETS_ENCRYPTION_KEY = "test-passphrase-for-smtp";
    const encrypted = encryptSecret("gmail-app-pass");
    expect(isEncryptedSecret(encrypted)).toBe(true);
    expect(decryptSecret(encrypted)).toBe("gmail-app-pass");
  });

  it("round-trips with a 64-char hex key", () => {
    process.env.SECRETS_ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const encrypted = encryptSecret("secret");
    expect(decryptSecret(encrypted)).toBe("secret");
  });
});
