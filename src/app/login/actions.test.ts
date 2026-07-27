import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signInWithPassword: vi.fn(),
  rpc: vi.fn(),
  isPlatformAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
      signInWithPassword: mocks.signInWithPassword,
    },
    rpc: mocks.rpc,
  })),
}));

vi.mock("@/lib/platform-admin", () => ({
  isPlatformAdmin: mocks.isPlatformAdmin,
}));

import {
  resolvePostLoginDestination,
  signInWithPasswordAction,
} from "@/app/login/actions";
import { safeDashboardDestination } from "@/lib/auth/destination";

describe("post-login bestemming", () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.signInWithPassword.mockReset();
    mocks.rpc.mockReset();
    mocks.isPlatformAdmin.mockReset();
  });

  it("stuurt een CEO altijd naar de adminconsole", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "ceo-id", email: "ceo@example.com" } },
    });
    mocks.isPlatformAdmin.mockResolvedValue(true);

    await expect(resolvePostLoginDestination("/dashboard")).resolves.toBe(
      "/admin",
    );
  });

  it("laat een gewone gebruiker niet naar admin gaan", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-id", email: "user@example.com" } },
    });
    mocks.isPlatformAdmin.mockResolvedValue(false);

    await expect(resolvePostLoginDestination("/admin")).resolves.toBe(
      "/dashboard/command-center",
    );
  });

  it("behoudt een geldige dashboardbestemming", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-id", email: "user@example.com" } },
    });
    mocks.isPlatformAdmin.mockResolvedValue(false);

    await expect(
      resolvePostLoginDestination("/dashboard/offertes?status=concept"),
    ).resolves.toBe("/dashboard/offertes?status=concept");
  });

  it("stuurt zonder sessie terug naar login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(resolvePostLoginDestination("/dashboard")).resolves.toBe(
      "/login",
    );
    expect(mocks.isPlatformAdmin).not.toHaveBeenCalled();
  });

  it("weigert externe en gelijkende dashboard-URL's", () => {
    expect(safeDashboardDestination("//example.com/dashboard")).toBeNull();
    expect(safeDashboardDestination("https://example.com/dashboard")).toBeNull();
    expect(safeDashboardDestination("/dashboard-malicious")).toBeNull();
  });

  it("handelt een mislukte netwerkverbinding gecontroleerd af", async () => {
    mocks.signInWithPassword.mockRejectedValue(new TypeError("Load failed"));

    await expect(
      signInWithPasswordAction({
        email: "user@example.com",
        password: "secret",
        requested: "/dashboard",
      }),
    ).resolves.toEqual({
      error:
        "De verbinding met de inlogdienst is mislukt. Controleer je internetverbinding en probeer opnieuw.",
    });
  });

  it("stuurt een ingelogde CEO server-side naar admin", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: "ceo-id",
          email: "ceo@example.com",
          user_metadata: {},
        },
      },
      error: null,
    });
    mocks.isPlatformAdmin.mockResolvedValue(true);

    await expect(
      signInWithPasswordAction({
        email: "ceo@example.com",
        password: "secret",
        requested: "/dashboard",
      }),
    ).resolves.toEqual({ destination: "/admin" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
