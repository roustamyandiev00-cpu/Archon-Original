import { describe, expect, it } from "vitest";
import {
  isTrustedAdminMutationOrigin,
  parseAdminTokenRequest,
} from "./route";

describe("isTrustedAdminMutationOrigin", () => {
  it("accepteert alleen dezelfde browser-origin", () => {
    const request = new Request("https://app.archonpro.be/api/admin/ai-tokens", {
      method: "POST",
      headers: { origin: "https://app.archonpro.be" },
    });

    expect(isTrustedAdminMutationOrigin(request)).toBe(true);
  });

  it("weigert cross-origin en requests zonder browser-originbewijs", () => {
    const crossOrigin = new Request(
      "https://app.archonpro.be/api/admin/ai-tokens",
      {
        method: "POST",
        headers: { origin: "https://evil.example" },
      },
    );
    const noOrigin = new Request(
      "https://app.archonpro.be/api/admin/ai-tokens",
      { method: "POST" },
    );

    expect(isTrustedAdminMutationOrigin(crossOrigin)).toBe(false);
    expect(isTrustedAdminMutationOrigin(noOrigin)).toBe(false);
  });

  it("accepteert same-origin Fetch Metadata als Origin ontbreekt", () => {
    const request = new Request("https://app.archonpro.be/api/admin/ai-tokens", {
      method: "POST",
      headers: { "sec-fetch-site": "same-origin" },
    });

    expect(isTrustedAdminMutationOrigin(request)).toBe(true);
  });
});

describe("parseAdminTokenRequest", () => {
  it("accepteert begrensde CEO-tokenacties", () => {
    expect(
      parseAdminTokenRequest({
        action: "grant_tokens",
        companyId: 12,
        tokensToAdd: 5_000,
        idempotencyKey: "d95c9e88-c21a-4b25-b43b-76d539980aac",
        note: "  Correctie CEO  ",
      }),
    ).toEqual({
      action: "grant_tokens",
      companyId: 12,
      tokensToAdd: 5_000,
      idempotencyKey: "d95c9e88-c21a-4b25-b43b-76d539980aac",
      note: "Correctie CEO",
    });

    expect(
      parseAdminTokenRequest({
        action: "update_limit",
        companyId: 12,
        tokenLimit: null,
      }),
    ).not.toBeNull();
  });

  it("weigert negatieve, onveilige en te grote waarden", () => {
    expect(
      parseAdminTokenRequest({
        action: "grant_tokens",
        companyId: 12,
        tokensToAdd: -1,
        idempotencyKey: "d95c9e88-c21a-4b25-b43b-76d539980aac",
      }),
    ).toBeNull();
    expect(
      parseAdminTokenRequest({
        action: "update_limit",
        companyId: 0,
        tokenLimit: 100,
      }),
    ).toBeNull();
    expect(
      parseAdminTokenRequest({
        action: "bulk_update_trial",
        tokenLimit: Number.POSITIVE_INFINITY,
      }),
    ).toBeNull();
    expect(
      parseAdminTokenRequest({
        action: "grant_tokens",
        companyId: 12,
        tokensToAdd: 10_000_001,
        idempotencyKey: "d95c9e88-c21a-4b25-b43b-76d539980aac",
      }),
    ).toBeNull();
  });

  it("weigert onbekende acties en te lange notities", () => {
    expect(parseAdminTokenRequest({ action: "delete_company" })).toBeNull();
    expect(
      parseAdminTokenRequest({
        action: "grant_tokens",
        companyId: 12,
        tokensToAdd: 1,
        idempotencyKey: "d95c9e88-c21a-4b25-b43b-76d539980aac",
        note: "x".repeat(501),
      }),
    ).toBeNull();
  });

  it("vereist een geldige idempotency UUID voor grants", () => {
    expect(
      parseAdminTokenRequest({
        action: "grant_tokens",
        companyId: 12,
        tokensToAdd: 1,
      }),
    ).toBeNull();
    expect(
      parseAdminTokenRequest({
        action: "grant_tokens",
        companyId: 12,
        tokensToAdd: 1,
        idempotencyKey: "geen-uuid",
      }),
    ).toBeNull();
  });
});
