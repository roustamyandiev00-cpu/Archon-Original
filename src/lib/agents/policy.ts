import type { AgentId } from "@/lib/agents/router";

export type AutonomyLevel = 1 | 2 | 3 | 4;

export type RiskLevel = "low" | "medium" | "high";

export type ActionChannel = "internal" | "email" | "whatsapp" | "peppol";

export type PolicyDecision = {
  allowed: boolean;
  autonomyLevel: AutonomyLevel;
  requiresApproval: boolean;
  riskLevel: RiskLevel;
  allowedChannels: ActionChannel[];
  cooldownHours: number;
  reversibility: "none" | "partial" | "full";
  reason?: string;
};

export type PolicyInput = {
  agentId: AgentId;
  actionType: string;
  tenantId: number;
  userRole?: string;
  isExternal: boolean;
};

const POLICIES: Record<
  string,
  Omit<PolicyDecision, "allowed" | "reason"> & { denyExternal?: boolean }
> = {
  "Nova:send_quote_followup": {
    autonomyLevel: 3,
    requiresApproval: true,
    riskLevel: "medium",
    allowedChannels: ["email"],
    cooldownHours: 72,
    reversibility: "none",
    denyExternal: false,
  },
  "Nova:internal_note": {
    autonomyLevel: 4,
    requiresApproval: false,
    riskLevel: "low",
    allowedChannels: ["internal"],
    cooldownHours: 1,
    reversibility: "full",
  },
  "Lima:send_payment_reminder": {
    autonomyLevel: 3,
    requiresApproval: true,
    riskLevel: "medium",
    allowedChannels: ["email"],
    cooldownHours: 48,
    reversibility: "none",
  },
  "Lima:send_formal_notice": {
    autonomyLevel: 3,
    requiresApproval: true,
    riskLevel: "high",
    allowedChannels: ["email"],
    cooldownHours: 72,
    reversibility: "none",
  },
  "Lima:forward_to_bailiff": {
    autonomyLevel: 3,
    requiresApproval: true,
    riskLevel: "high",
    allowedChannels: ["email"],
    cooldownHours: 168,
    reversibility: "none",
  },
  "Nova:create_offerte": {
    autonomyLevel: 3,
    requiresApproval: true,
    riskLevel: "medium",
    allowedChannels: ["internal"],
    cooldownHours: 0,
    reversibility: "partial",
  },
  "Nova:send_offerte": {
    autonomyLevel: 3,
    requiresApproval: true,
    riskLevel: "medium",
    allowedChannels: ["email"],
    cooldownHours: 24,
    reversibility: "none",
  },
  "Lima:create_invoice_from_offerte": {
    autonomyLevel: 3,
    requiresApproval: true,
    riskLevel: "medium",
    allowedChannels: ["internal", "peppol"],
    cooldownHours: 0,
    reversibility: "partial",
  },
};

function policyKey(agentId: AgentId, actionType: string): string {
  return `${agentId}:${actionType}`;
}

/** Deterministic policy — LLM never decides permissions. */
export function evaluatePolicy(input: PolicyInput): PolicyDecision {
  const key = policyKey(input.agentId, input.actionType);
  const rule = POLICIES[key];

  if (!rule) {
    return {
      allowed: false,
      autonomyLevel: 3,
      requiresApproval: true,
      riskLevel: "high",
      allowedChannels: [],
      cooldownHours: 0,
      reversibility: "none",
      reason: `Geen policy gedefinieerd voor ${key}`,
    };
  }

  if (input.isExternal && rule.denyExternal) {
    return {
      allowed: false,
      autonomyLevel: rule.autonomyLevel,
      requiresApproval: true,
      riskLevel: rule.riskLevel,
      allowedChannels: [],
      cooldownHours: rule.cooldownHours,
      reversibility: rule.reversibility,
      reason: "Externe communicatie niet toegestaan voor deze actie",
    };
  }

  return {
    allowed: true,
    autonomyLevel: rule.autonomyLevel,
    requiresApproval: rule.requiresApproval,
    riskLevel: rule.riskLevel,
    allowedChannels: rule.allowedChannels,
    cooldownHours: rule.cooldownHours,
    reversibility: rule.reversibility,
  };
}

export function canApproveAction(userRole?: string): boolean {
  if (!userRole) return true;
  const blocked = new Set(["viewer", "readonly"]);
  return !blocked.has(userRole.toLowerCase());
}
