import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  cookieAdapter: null as null | {
    setAll: (
      cookies: Array<{
        name: string;
        value: string;
        options?: Record<string, unknown>;
      }>,
    ) => void;
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(
    (
      _url: string,
      _key: string,
      options: {
        cookies: {
          setAll: typeof mocks.cookieAdapter extends null
            ? never
            : NonNullable<typeof mocks.cookieAdapter>["setAll"];
        };
      },
    ) => {
      mocks.cookieAdapter = options.cookies;
      return { auth: { getUser: mocks.getUser } };
    },
  ),
}));

vi.mock("@/lib/supabase/env", () => ({
  getSupabaseUrl: () => "https://example.supabase.co",
  getSupabaseAnonKey: () => "publishable-key",
}));

vi.mock("@/components/dashboard/trial", () => ({
  PREVIEW_COOKIE: "archonpro-preview",
}));

import { updateSession } from "@/lib/supabase/middleware";

describe("Supabase auth middleware", () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.cookieAdapter = null;
  });

  it("behandelt een publieke request zonder sessie als normale toestand", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: "session_not_found", message: "Auth session missing!" },
    });

    const response = await updateSession(
      new NextRequest("https://archonpro.test/register"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("redirectt een beschermde route zonder geldige user naar login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await updateSession(
      new NextRequest("https://archonpro.test/dashboard/offertes?status=concept"),
    );

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("redirect")).toBe(
      "/dashboard/offertes?status=concept",
    );
  });

  it("faalt gesloten bij getUser-fout ondanks een verouderde auth-cookie", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: "unexpected_failure", message: "Auth service unavailable" },
    });

    const response = await updateSession(
      new NextRequest("https://archonpro.test/admin", {
        headers: { cookie: "sb-example-auth-token=stale" },
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://archonpro.test/login?redirect=%2Fadmin",
    );
    expect(consoleError).toHaveBeenCalledWith(
      "[auth] getUser error in middleware:",
      "Auth service unavailable",
    );
    consoleError.mockRestore();
  });

  it("behoudt refresh-cookies op een auth-redirect", async () => {
    mocks.getUser.mockImplementation(async () => {
      mocks.cookieAdapter?.setAll([
        {
          name: "sb-example-auth-token",
          value: "refreshed",
          options: { httpOnly: true },
        },
      ]);
      return { data: { user: null }, error: null };
    });

    const response = await updateSession(
      new NextRequest("https://archonpro.test/dashboard"),
    );

    expect(response.status).toBe(307);
    expect(response.cookies.get("sb-example-auth-token")?.value).toBe(
      "refreshed",
    );
  });
});
