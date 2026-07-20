import { describe, expect, it } from "vitest";
import { canApproveAction } from "@/lib/agents/policy";

describe("canApproveAction (deny-by-default allowlist)", () => {
  it("staat owner en admin toe", () => {
    expect(canApproveAction("owner")).toBe(true);
    expect(canApproveAction("admin")).toBe(true);
    expect(canApproveAction("ADMIN")).toBe(true);
  });

  it("weigert member, viewer, readonly en guest", () => {
    expect(canApproveAction("member")).toBe(false);
    expect(canApproveAction("viewer")).toBe(false);
    expect(canApproveAction("readonly")).toBe(false);
    expect(canApproveAction("read_only")).toBe(false);
    expect(canApproveAction("guest")).toBe(false);
  });

  it("weigert undefined, null, lege en onbekende rollen", () => {
    expect(canApproveAction(undefined)).toBe(false);
    expect(canApproveAction(null)).toBe(false);
    expect(canApproveAction("")).toBe(false);
    expect(canApproveAction("   ")).toBe(false);
    expect(canApproveAction("superuser")).toBe(false);
    expect(canApproveAction("platform_admin")).toBe(false);
  });
});
