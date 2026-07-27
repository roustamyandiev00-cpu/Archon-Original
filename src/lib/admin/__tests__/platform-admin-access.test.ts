import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const serviceFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc }),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: serviceFrom }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/integraties", () => ({
  untyped: (value: unknown) => value,
}));

import { isPlatformAdmin } from "@/lib/platform-admin";

describe("platform admin access", () => {
  beforeEach(() => {
    vi.stubEnv("PLATFORM_ADMIN_BOOTSTRAP_ENABLED", "");
    vi.stubEnv("PLATFORM_CEO_EMAIL", "");
    vi.stubEnv("PLATFORM_ADMIN_EMAILS", "");
    rpc.mockReset();
    serviceFrom.mockReset();
    rpc.mockResolvedValue({ data: false, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("negeert CEO-mail wanneer bootstrap uit staat", async () => {
    vi.stubEnv("PLATFORM_CEO_EMAIL", "ceo@example.com");

    await expect(isPlatformAdmin("ceo-id", "ceo@example.com")).resolves.toBe(
      false,
    );
    expect(rpc).toHaveBeenCalledWith("is_platform_admin", {
      p_user_id: "ceo-id",
    });
  });

  it("laat bootstrap CEO-mail toe wanneer flag aan staat", async () => {
    vi.stubEnv("PLATFORM_ADMIN_BOOTSTRAP_ENABLED", "true");
    vi.stubEnv("PLATFORM_CEO_EMAIL", "ceo@example.com");
    serviceFrom.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          limit: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }));

    await expect(isPlatformAdmin("ceo-id", "CEO@example.com")).resolves.toBe(
      true,
    );
    // Niet-matchend adres krijgt geen bootstraptoegang, maar valt wel door naar
    // de database — bootstrap mag een echte platform_admins-rij niet blokkeren.
    await expect(
      isPlatformAdmin("other-id", "other@example.com"),
    ).resolves.toBe(false);
    expect(rpc).toHaveBeenCalledWith("is_platform_admin", {
      p_user_id: "other-id",
    });
  });

  it("sluit database-admins niet buiten terwijl bootstrap aan staat", async () => {
    vi.stubEnv("PLATFORM_ADMIN_BOOTSTRAP_ENABLED", "true");
    vi.stubEnv("PLATFORM_CEO_EMAIL", "ceo@example.com");
    rpc.mockResolvedValue({ data: true, error: null });

    await expect(
      isPlatformAdmin("db-admin-id", "db-admin@example.com"),
    ).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("is_platform_admin", {
      p_user_id: "db-admin-id",
    });
  });

  it("accepteert meerdere bootstrap-admins via PLATFORM_ADMIN_EMAILS", async () => {
    vi.stubEnv("PLATFORM_ADMIN_BOOTSTRAP_ENABLED", "true");
    vi.stubEnv(
      "PLATFORM_ADMIN_EMAILS",
      "ceo@example.com, support@example.com",
    );
    serviceFrom.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          limit: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }));

    await expect(isPlatformAdmin("ceo-id", "ceo@example.com")).resolves.toBe(
      true,
    );
    await expect(
      isPlatformAdmin("support-id", "support@example.com"),
    ).resolves.toBe(true);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("weigert bootstrap zonder userId (geen anonieme toegang)", async () => {
    vi.stubEnv("PLATFORM_ADMIN_BOOTSTRAP_ENABLED", "true");
    vi.stubEnv("PLATFORM_CEO_EMAIL", "ceo@example.com");

    await expect(isPlatformAdmin(undefined, "ceo@example.com")).resolves.toBe(
      false,
    );
  });

  it("valt terug op RPC wanneer bootstrap uit staat", async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    await expect(
      isPlatformAdmin("db-admin-id", "anyone@example.com"),
    ).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("is_platform_admin", {
      p_user_id: "db-admin-id",
    });
  });
});
