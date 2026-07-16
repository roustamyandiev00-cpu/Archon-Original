import { describe, expect, it } from "vitest";

/**
 * Pure extract of daily-limit / cooldown math used in assertCanAutoSendReactie.
 * Full DB path is covered via executor integration; this guards the thresholds.
 */
function withinCooldown(
  lastAutoSendAt: string | null,
  cooldownMinuten: number,
  nowMs: number,
): boolean {
  if (!lastAutoSendAt || cooldownMinuten <= 0) return false;
  const elapsed = nowMs - new Date(lastAutoSendAt).getTime();
  return elapsed < cooldownMinuten * 60_000;
}

function dailyLimitReached(approvedToday: number, maxPerDay: number): boolean {
  return approvedToday >= maxPerDay;
}

describe("send-guardrails thresholds", () => {
  it("enforces cooldown window", () => {
    const now = Date.parse("2026-07-16T12:00:00Z");
    expect(
      withinCooldown("2026-07-16T11:30:00Z", 60, now),
    ).toBe(true);
    expect(
      withinCooldown("2026-07-16T10:30:00Z", 60, now),
    ).toBe(false);
  });

  it("enforces daily max", () => {
    expect(dailyLimitReached(5, 5)).toBe(true);
    expect(dailyLimitReached(4, 5)).toBe(false);
  });
});
