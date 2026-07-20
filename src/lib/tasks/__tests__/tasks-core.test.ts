import { describe, expect, it } from "vitest";
import { parseTaskInput } from "@/lib/tasks/validation";
import {
  advanceRecurrenceDate,
  buildOccurrenceKey,
} from "@/lib/tasks/recurrence";
import { canApproveAction } from "@/lib/agents/policy";
import { authorizeCronRequest } from "@/lib/cron/auth";

describe("task validation", () => {
  it("vereist titel", () => {
    expect(parseTaskInput({ title: "  " }).ok).toBe(false);
  });

  it("accepteert geldige input", () => {
    const result = parseTaskInput({
      title: "Bel klant",
      status: "todo",
      priority: "high",
      contactId: 12,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBe("Bel klant");
      expect(result.data.priority).toBe("high");
    }
  });

  it("weigert ongeldige status", () => {
    const result = parseTaskInput({
      title: "x",
      status: "nope" as never,
    });
    expect(result.ok).toBe(false);
  });
});

describe("recurrence helpers", () => {
  it("bouwt occurrence keys", () => {
    const d = new Date("2026-07-20T10:00:00.000Z");
    expect(buildOccurrenceKey(9, d)).toBe("9:2026-07-20");
  });

  it("schuift daily/weekly/monthly vooruit", () => {
    const base = new Date("2026-01-01T00:00:00.000Z");
    expect(advanceRecurrenceDate(base, "daily", 2).toISOString().slice(0, 10)).toBe(
      "2026-01-03",
    );
    expect(
      advanceRecurrenceDate(base, "weekly", 1).toISOString().slice(0, 10),
    ).toBe("2026-01-08");
    expect(
      advanceRecurrenceDate(base, "monthly", 1).toISOString().slice(0, 10),
    ).toBe("2026-02-01");
  });
});

describe("task-related security helpers", () => {
  it("canApproveAction is deny-by-default", () => {
    expect(canApproveAction(undefined)).toBe(false);
    expect(canApproveAction("member")).toBe(false);
    expect(canApproveAction("admin")).toBe(true);
  });

  it("cron auth weigert zonder secret", () => {
    const prev = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    expect(
      authorizeCronRequest(
        new Request("http://localhost", {
          headers: { authorization: "Bearer x" },
        }),
      ),
    ).toBe(false);
    process.env.CRON_SECRET = prev;
  });
});
