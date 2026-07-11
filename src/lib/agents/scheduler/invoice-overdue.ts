import type { SupabaseClient } from "@supabase/supabase-js";
import { emitDomainEvent } from "@/lib/agents/events/emit";
import { buildIdempotencyKey } from "@/lib/agents/events/dedup";
import {
  buildInvoiceOverdueContext,
  isInvoiceEligibleForReminder,
} from "@/lib/agents/context/invoice-overdue";
import { dispatchSingleEvent } from "@/lib/agents/dispatcher";
import type { ScheduleResult } from "@/lib/agents/scheduler/quote-followup";

export async function scheduleInvoiceOverdueEvents(
  supabase: SupabaseClient,
  tenantId: number,
  opts?: { autoExecuteUserId?: string | null },
): Promise<ScheduleResult> {
  const result: ScheduleResult = {
    scanned: 0,
    emitted: 0,
    duplicates: 0,
    errors: [],
  };

  const today = new Date().toISOString().slice(0, 10);

  const { data: facturen } = await supabase
    .from("facturen")
    .select("id")
    .eq("bedrijf_id", tenantId)
    .is("paid_at", null)
    .neq("status", "betaald")
    .lt("vervaldatum", today)
    .order("vervaldatum", { ascending: true })
    .limit(50);

  for (const row of facturen ?? []) {
    result.scanned += 1;

    const ctx = await buildInvoiceOverdueContext(supabase, tenantId, row.id);
    if (!ctx) continue;

    const eligibility = isInvoiceEligibleForReminder(ctx);
    if (!eligibility.eligible) continue;

    const idempotencyKey = buildIdempotencyKey([
      "invoice.overdue",
      tenantId,
      row.id,
      ctx.stage,
      new Date().toISOString().slice(0, 10),
    ]);

    const emitted = await emitDomainEvent({
      supabase,
      eventType: "invoice.overdue",
      tenantId,
      entityType: "factuur",
      entityId: row.id,
      payload: {
        factuurNummer: ctx.nummer,
        klant: ctx.klant,
        daysOverdue: ctx.daysOverdue,
        stage: ctx.stage,
      },
      idempotencyKey,
    });

    if ("duplicate" in emitted && emitted.duplicate) {
      result.duplicates += 1;
      continue;
    }
    if ("error" in emitted) {
      result.errors.push(emitted.error);
      continue;
    }

    result.emitted += 1;

    const dispatch = await dispatchSingleEvent(
      supabase,
      emitted.dbId,
      opts?.autoExecuteUserId
        ? { autoExecuteUserId: opts.autoExecuteUserId }
        : undefined,
    );
    if (!dispatch.ok && dispatch.error) {
      result.errors.push(dispatch.error);
    }
  }

  return result;
}

export async function scheduleInvoiceOverdueForAllTenants(
  supabase: SupabaseClient,
): Promise<{ tenants: number; emitted: number; errors: string[] }> {
  const { data: companies } = await supabase
    .from("bedrijven")
    .select("id")
    .limit(500);

  let emitted = 0;
  const errors: string[] = [];

  for (const company of companies ?? []) {
    const result = await scheduleInvoiceOverdueEvents(supabase, company.id);
    emitted += result.emitted;
    errors.push(...result.errors);
  }

  return { tenants: companies?.length ?? 0, emitted, errors };
}
