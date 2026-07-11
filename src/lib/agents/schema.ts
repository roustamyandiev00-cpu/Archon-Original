import type { AutonomyLevel, RiskLevel } from "@/lib/agents/policy";

export type StructuredAgentOutput = {
  agentId: string;
  actionType: string;
  entityType: string;
  entityId: number;
  summary: string;
  reason: string;
  evidence: Array<{
    sourceType: string;
    sourceId: string | number;
    field?: string;
    snapshot?: string;
    observedAt: string;
  }>;
  proposedChanges?: Array<{
    field: string;
    currentValue?: string;
    proposedValue: string;
    source: string;
    confidence: number;
  }>;
  riskLevel: RiskLevel;
  confidence: number;
  autonomyLevel: AutonomyLevel;
  requiresApproval: boolean;
  communicationIntent?: {
    channel: string;
    draftMessage: string;
    recipientEmail?: string | null;
  };
  expiresAt: string;
  idempotencyKey: string;
  correlationId: string;
};

export type ValidationResult =
  | { valid: true; output: StructuredAgentOutput }
  | { valid: false; errors: string[] };

function isRiskLevel(v: unknown): v is RiskLevel {
  return v === "low" || v === "medium" || v === "high";
}

function isAutonomyLevel(v: unknown): v is AutonomyLevel {
  return v === 1 || v === 2 || v === 3 || v === 4;
}

export function validateStructuredOutput(
  raw: unknown,
): ValidationResult {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return { valid: false, errors: ["Output is geen object"] };
  }

  const o = raw as Record<string, unknown>;

  if (typeof o.agentId !== "string" || !o.agentId) errors.push("agentId ontbreekt");
  if (typeof o.actionType !== "string" || !o.actionType) errors.push("actionType ontbreekt");
  if (typeof o.entityType !== "string") errors.push("entityType ontbreekt");
  if (typeof o.entityId !== "number") errors.push("entityId ontbreekt");
  if (typeof o.summary !== "string" || !o.summary) errors.push("summary ontbreekt");
  if (typeof o.reason !== "string" || !o.reason) errors.push("reason ontbreekt");
  if (!Array.isArray(o.evidence)) errors.push("evidence moet een array zijn");
  if (!isRiskLevel(o.riskLevel)) errors.push("riskLevel ongeldig");
  if (typeof o.confidence !== "number" || o.confidence < 0 || o.confidence > 1) {
    errors.push("confidence moet tussen 0 en 1 liggen");
  }
  if (!isAutonomyLevel(o.autonomyLevel)) errors.push("autonomyLevel ongeldig");
  if (typeof o.requiresApproval !== "boolean") errors.push("requiresApproval ontbreekt");
  if (typeof o.expiresAt !== "string") errors.push("expiresAt ontbreekt");
  if (typeof o.idempotencyKey !== "string" || !o.idempotencyKey) {
    errors.push("idempotencyKey ontbreekt");
  }
  if (typeof o.correlationId !== "string" || !o.correlationId) {
    errors.push("correlationId ontbreekt");
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    output: o as unknown as StructuredAgentOutput,
  };
}
