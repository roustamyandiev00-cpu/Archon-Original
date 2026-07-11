export const WORKFLOW_STATUSES = [
  "detected",
  "analyzing",
  "proposed",
  "awaiting_approval",
  "approved",
  "executing",
  "completed",
  "rejected",
  "failed",
  "expired",
  "reverted",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  detected: ["analyzing", "failed"],
  analyzing: ["proposed", "failed", "completed"],
  proposed: ["awaiting_approval", "failed", "expired"],
  awaiting_approval: ["approved", "rejected", "expired"],
  approved: ["executing", "failed", "expired"],
  executing: ["completed", "failed", "reverted"],
  completed: [],
  rejected: [],
  failed: [],
  expired: [],
  reverted: [],
};

export function canTransition(
  from: WorkflowStatus,
  to: WorkflowStatus,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: WorkflowStatus,
  to: WorkflowStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Ongeldige workflowovergang: ${from} → ${to}`);
  }
}

export function mapAgentActionStatus(
  actionStatus: string,
  executedAt?: string | null,
): WorkflowStatus {
  if (executedAt) return "completed";
  switch (actionStatus) {
    case "pending":
      return "awaiting_approval";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    default:
      return "detected";
  }
}

export function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}
