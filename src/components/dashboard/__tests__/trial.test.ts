import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRIAL_DAYS, computeTrialStatus } from "@/components/dashboard/trial";

describe("computeTrialStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("behandelt active/past_due als isPaid", () => {
    expect(computeTrialStatus("2026-01-01", "active").isPaid).toBe(true);
    expect(computeTrialStatus("2026-01-01", "past_due").expired).toBe(false);
    expect(computeTrialStatus("2026-01-01", "active").expired).toBe(false);
  });

  it("markeert expired subscription als verlopen trial", () => {
    const result = computeTrialStatus("2026-07-10", "expired");
    expect(result).toMatchObject({
      active: true,
      expired: true,
      daysLeft: 0,
      isPaid: false,
    });
  });

  it("berekent resterende trial-dagen vanaf created_at", () => {
    const createdAt = "2026-07-14T12:00:00.000Z";
    const result = computeTrialStatus(createdAt, "trial");
    expect(result.active).toBe(true);
    expect(result.isPaid).toBe(false);
    expect(result.expired).toBe(false);
    expect(result.daysLeft).toBe(TRIAL_DAYS - 2);
  });

  it("markeert trial ouder dan TRIAL_DAYS als expired", () => {
    const result = computeTrialStatus("2026-07-01T12:00:00.000Z", "trial");
    expect(result.active).toBe(true);
    expect(result.expired).toBe(true);
    expect(result.daysLeft).toBe(0);
    expect(result.isPaid).toBe(false);
  });

  it("faalt closed bij ontbrekende created_at tijdens trial", () => {
    const result = computeTrialStatus(null, "trial");
    expect(result.expired).toBe(true);
    expect(result.isPaid).toBe(false);
  });
});
