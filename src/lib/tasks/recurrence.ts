/** Recurrence semantics (Europe/Brussels default via rule.timezone).
 * - daily/weekly/monthly with interval_count
 * - next task is created only when cron runs and occurrence_key is free
 * - occurrence_key = `${ruleId}:${ISO date of planned run}`
 * - stopping: set is_active=false
 * - skip: advance next_run_at without creating a task
 */

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export function buildOccurrenceKey(ruleId: number, runAt: Date): string {
  return `${ruleId}:${runAt.toISOString().slice(0, 10)}`;
}

export function advanceRecurrenceDate(
  from: Date,
  frequency: RecurrenceFrequency,
  intervalCount: number,
): Date {
  const next = new Date(from.getTime());
  const step = Math.max(1, intervalCount);
  if (frequency === "daily") {
    next.setUTCDate(next.getUTCDate() + step);
  } else if (frequency === "weekly") {
    next.setUTCDate(next.getUTCDate() + 7 * step);
  } else {
    next.setUTCMonth(next.getUTCMonth() + step);
  }
  return next;
}
