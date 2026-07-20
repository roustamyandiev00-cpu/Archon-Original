import { afterEach, describe, expect, it, vi } from "vitest";
import { authorizeCronRequest } from "@/lib/cron/auth";

describe("authorizeCronRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("weigert wanneer CRON_SECRET ontbreekt", () => {
    vi.stubEnv("CRON_SECRET", "");
    const req = new Request("http://localhost/api/cron/x", {
      headers: { authorization: "Bearer anything" },
    });
    expect(authorizeCronRequest(req)).toBe(false);
  });

  it("weigert fout secret", () => {
    vi.stubEnv("CRON_SECRET", "correct-secret");
    const req = new Request("http://localhost/api/cron/x", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    expect(authorizeCronRequest(req)).toBe(false);
  });

  it("accepteert correct Bearer secret", () => {
    vi.stubEnv("CRON_SECRET", "correct-secret");
    const req = new Request("http://localhost/api/cron/x", {
      headers: { authorization: "Bearer correct-secret" },
    });
    expect(authorizeCronRequest(req)).toBe(true);
  });
});
