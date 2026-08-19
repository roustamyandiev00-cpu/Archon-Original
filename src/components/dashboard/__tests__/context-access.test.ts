import { describe, expect, it } from "vitest";

/**
 * Lichtgewicht contracttest: admin-gate API moet bestaan en
 * WriteAccessOk moet isAdmin/role meedragen (zie context.ts).
 */
describe("requireAdminAccess contract", () => {
  it("exporteert requireAdminAccess naast requireWriteAccess", async () => {
    const mod = await import("@/components/dashboard/context");
    expect(typeof mod.requireWriteAccess).toBe("function");
    expect(typeof mod.requireAdminAccess).toBe("function");
  });
});
