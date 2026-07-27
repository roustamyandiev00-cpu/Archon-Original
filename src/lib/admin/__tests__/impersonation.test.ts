import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieSet: vi.fn(),
  cookieDelete: vi.fn(),
  cookieGet: vi.fn(),
  getUser: vi.fn(),
  isPlatformAdmin: vi.fn(),
  serviceFrom: vi.fn(),
  createServiceClient: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: mocks.cookieSet,
    delete: mocks.cookieDelete,
    get: mocks.cookieGet,
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: mocks.createServiceClient,
}));
vi.mock("@/lib/platform-admin", () => ({
  isPlatformAdmin: mocks.isPlatformAdmin,
}));
vi.mock("@/lib/integraties", () => ({ untyped: (value: unknown) => value }));

import { getImpersonationContext, startImpersonation } from "@/lib/impersonation";

function configureService(options?: {
  companyExists?: boolean;
  logFails?: boolean;
  auditFails?: boolean;
  otherPlatformAdmin?: boolean;
}) {
  mocks.serviceFrom.mockImplementation((table: string) => {
    if (table === "bedrijven") {
      const query = {
        eq: vi.fn(() => query),
        maybeSingle: vi.fn(async () => ({
          data: options?.companyExists === false ? null : { id: 42 },
          error: null,
        })),
      };
      return { select: vi.fn(() => query) };
    }
    if (table === "company_memberships") {
      const query = {
        eq: vi.fn(() => query),
        then: undefined as unknown,
      };
      return {
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({
            data: options?.otherPlatformAdmin
              ? [{ user_id: "other-admin" }]
              : [],
            error: null,
          })),
        })),
      };
    }
    if (table === "platform_admins") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(async () => ({
              data: options?.otherPlatformAdmin
                ? [{ user_id: "other-admin" }]
                : [],
              error: null,
            })),
          })),
        })),
      };
    }
    if (table === "admin_impersonation_log") {
      return {
        insert: vi.fn(async () => ({
          error: options?.logFails ? { message: "audit unavailable" } : null,
        })),
      };
    }
    if (table === "audit_logs") {
      return {
        insert: vi.fn(async () => ({
          error: options?.auditFails ? { message: "audit_logs fail" } : null,
        })),
      };
    }
    throw new Error(`Onverwachte tabel: ${table}`);
  });
}

describe("startImpersonation", () => {
  beforeEach(() => {
    vi.stubEnv("IMPERSONATION_SECRET", "test-secret-with-enough-entropy");
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "ceo@example.com" } },
    });
    mocks.isPlatformAdmin.mockResolvedValue(true);
    mocks.createServiceClient.mockReturnValue({ from: mocks.serviceFrom });
    configureService();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("weigert een ongeldig doelbedrijf zonder sessiecookie", async () => {
    await expect(startImpersonation(0)).resolves.toEqual({
      error: "Ongeldig bedrijf.",
    });
    expect(mocks.cookieSet).not.toHaveBeenCalled();
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
  });

  it("weigert niet-admin", async () => {
    mocks.isPlatformAdmin.mockResolvedValue(false);
    await expect(startImpersonation(42)).resolves.toEqual({
      error: "Geen platform-admin rechten.",
    });
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("weigert een onbekend bedrijf zonder sessiecookie", async () => {
    configureService({ companyExists: false });

    await expect(startImpersonation(42)).resolves.toEqual({
      error: "Bedrijf niet gevonden.",
    });
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("weigert bedrijf met andere platform-admin", async () => {
    configureService({ otherPlatformAdmin: true });

    await expect(startImpersonation(42)).resolves.toEqual({
      error:
        "Impersonatie van een bedrijf met een andere platform-admin is niet toegestaan.",
    });
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("faalt gesloten wanneer de start niet kan worden gelogd", async () => {
    configureService({ logFails: true });

    await expect(startImpersonation(42)).resolves.toEqual({
      error: "Impersonatie kon niet veilig worden gelogd.",
    });
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("plaatst pas na controle en audit een beperkte sessiecookie", async () => {
    await expect(startImpersonation(42, "support")).resolves.toEqual({
      ok: true,
    });
    expect(mocks.cookieSet).toHaveBeenCalledTimes(1);
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "archon_impersonation",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 1800,
      }),
    );
  });
});

describe("getImpersonationContext", () => {
  beforeEach(() => {
    vi.stubEnv("IMPERSONATION_SECRET", "test-secret-with-enough-entropy");
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "ceo@example.com" } },
    });
    mocks.isPlatformAdmin.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("negeert verlopen tokens", async () => {
    const body = Buffer.from(
      JSON.stringify({
        adminUserId: "admin-1",
        targetCompanyId: 42,
        expiresAt: Date.now() - 1000,
      }),
    ).toString("base64url");
    const crypto = await import("node:crypto");
    const signature = crypto
      .createHmac("sha256", "test-secret-with-enough-entropy")
      .update(body)
      .digest("base64url");
    mocks.cookieGet.mockReturnValue({ value: `${body}.${signature}` });

    await expect(getImpersonationContext()).resolves.toBeNull();
    expect(mocks.cookieDelete).toHaveBeenCalledWith("archon_impersonation");
  });
});
