import { describe, expect, it } from "vitest";
import {
  ADMIN_HOME,
  TENANT_HOME,
  isSafeInternalRedirect,
  pickPostLoginPath,
} from "@/lib/auth/post-login-redirect";

describe("isSafeInternalRedirect", () => {
  it("accepteert interne paden", () => {
    expect(isSafeInternalRedirect("/dashboard")).toBe(true);
    expect(isSafeInternalRedirect("/admin/companies")).toBe(true);
  });

  it("weigert open redirects", () => {
    expect(isSafeInternalRedirect("https://evil.com")).toBe(false);
    expect(isSafeInternalRedirect("//evil.com")).toBe(false);
    expect(isSafeInternalRedirect("/\\evil")).toBe(false);
  });
});

describe("pickPostLoginPath", () => {
  it("stuurt platform-admin naar /admin", () => {
    expect(
      pickPostLoginPath({ isPlatformAdmin: true, requested: null }),
    ).toBe(ADMIN_HOME);
    expect(
      pickPostLoginPath({ isPlatformAdmin: true, requested: "/dashboard" }),
    ).toBe(ADMIN_HOME);
    expect(
      pickPostLoginPath({
        isPlatformAdmin: true,
        requested: "/dashboard/offertes",
      }),
    ).toBe(ADMIN_HOME);
  });

  it("behoudt expliciete /admin deep-links voor platform-admin", () => {
    expect(
      pickPostLoginPath({
        isPlatformAdmin: true,
        requested: "/admin/companies",
      }),
    ).toBe("/admin/companies");
  });

  it("stuurt tenants naar hun dashboard", () => {
    expect(
      pickPostLoginPath({ isPlatformAdmin: false, requested: null }),
    ).toBe(TENANT_HOME);
    expect(
      pickPostLoginPath({
        isPlatformAdmin: false,
        requested: "/dashboard/facturen",
      }),
    ).toBe("/dashboard/facturen");
  });

  it("stuurt tenants niet naar /admin", () => {
    expect(
      pickPostLoginPath({ isPlatformAdmin: false, requested: "/admin" }),
    ).toBe(TENANT_HOME);
  });
});
