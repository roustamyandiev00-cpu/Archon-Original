import { describe, expect, it } from "vitest";
import { canApproveAction, evaluatePolicy } from "@/lib/agents/policy";

describe("canApproveAction allowlist", () => {
  it("staat owner/admin toe", () => {
    expect(canApproveAction("owner")).toBe(true);
    expect(canApproveAction("admin")).toBe(true);
  });

  it("weigert undefined/null/member/viewer", () => {
    expect(canApproveAction(undefined)).toBe(false);
    expect(canApproveAction(null)).toBe(false);
    expect(canApproveAction("member")).toBe(false);
    expect(canApproveAction("viewer")).toBe(false);
  });
});

describe("Nova propose_create_task policy", () => {
  it("vereist approval", () => {
    const decision = evaluatePolicy({
      agentId: "Nova",
      actionType: "propose_create_task",
      tenantId: 1,
      isExternal: false,
    });
    expect(decision.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(true);
  });
});
