import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "@/lib/agents/policy";

describe("task agent policies", () => {
  it("vereist approval voor Nova propose_create_task", () => {
    const decision = evaluatePolicy({
      agentId: "Nova",
      actionType: "propose_create_task",
      tenantId: 1,
      isExternal: false,
    });
    expect(decision.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(true);
  });

  it("vereist approval voor Lima invoice follow-up task", () => {
    const decision = evaluatePolicy({
      agentId: "Lima",
      actionType: "propose_invoice_followup_task",
      tenantId: 1,
      isExternal: false,
    });
    expect(decision.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(true);
  });
});
