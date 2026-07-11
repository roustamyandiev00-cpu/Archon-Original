const MAX_ACTIONS_PER_CORRELATION = 10;
const MAX_WORKFLOW_DEPTH = 5;

export function buildIdempotencyKey(
  parts: (string | number | null | undefined)[],
): string {
  return parts.filter((p) => p != null && p !== "").join(":");
}

export function isSelfTriggered(
  originAgentId: string | null | undefined,
  handlingAgentId: string,
): boolean {
  return Boolean(originAgentId && originAgentId === handlingAgentId);
}

export function exceedsCorrelationLimit(actionCount: number): boolean {
  return actionCount >= MAX_ACTIONS_PER_CORRELATION;
}

export function exceedsWorkflowDepth(depth: number): boolean {
  return depth >= MAX_WORKFLOW_DEPTH;
}

export function isWithinCooldown(
  lastActionAt: string | null | undefined,
  cooldownHours: number,
): boolean {
  if (!lastActionAt) return false;
  const elapsed = Date.now() - new Date(lastActionAt).getTime();
  return elapsed < cooldownHours * 3_600_000;
}
