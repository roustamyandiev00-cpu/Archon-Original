import { describe, expect, it } from "vitest";
import { canWriteTasks, isTaskPriority, isTaskStatus } from "@/lib/tasks/types";
import {
  addRecurrenceInterval,
  nextOccurrenceKey,
  parseCreateTaskInput,
} from "@/lib/tasks/validation";

describe("tasks validation", () => {
  it("parses geldige create input", () => {
    const parsed = parseCreateTaskInput({
      title: "  Bel klant  ",
      status: "todo",
      priority: "high",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.title).toBe("Bel klant");
      expect(parsed.data.priority).toBe("high");
    }
  });

  it("weigert lege titel en ongeldige status", () => {
    expect(parseCreateTaskInput({ title: "   " }).ok).toBe(false);
    expect(parseCreateTaskInput({ title: "x", status: "nope" }).ok).toBe(false);
  });

  it("herkent status en prioriteit", () => {
    expect(isTaskStatus("completed")).toBe(true);
    expect(isTaskStatus("done")).toBe(false);
    expect(isTaskPriority("normal")).toBe(true);
    expect(isTaskPriority("medium")).toBe(false);
  });

  it("deny-by-default write roles", () => {
    expect(canWriteTasks("viewer", false)).toBe(false);
    expect(canWriteTasks("member", false)).toBe(true);
    expect(canWriteTasks("admin", false)).toBe(true);
    expect(canWriteTasks(null, true)).toBe(true);
    expect(canWriteTasks(undefined, false)).toBe(false);
  });

  it("maakt stabiele recurrence occurrence keys", () => {
    const d = new Date("2026-07-20T10:00:00Z");
    expect(nextOccurrenceKey("daily", d)).toBe("2026-07-20");
    expect(nextOccurrenceKey("monthly", d)).toBe("2026-07");
    const next = addRecurrenceInterval(d, "weekly", 1);
    expect(nextOccurrenceKey("weekly", next)).not.toEqual(
      nextOccurrenceKey("weekly", d),
    );
  });
});
