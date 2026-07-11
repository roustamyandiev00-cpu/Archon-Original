import type { SupabaseClient } from "@supabase/supabase-js";
import { emitDomainEvent } from "@/lib/agents/events/emit";
import { buildIdempotencyKey } from "@/lib/agents/events/dedup";
import {
  DEFAULT_QUOTE_FOLLOWUP_DAYS,
  buildQuoteFollowupContext,
  isQuoteEligibleForFollowup,
} from "@/lib/agents/context/quote-followup";
import { dispatchSingleEvent } from "@/lib/agents/dispatcher";

export type ScheduleResult = {
  scanned: number;
  emitted: number;
  duplicates: number;
  errors: string[];
};

export async function scheduleQuoteFollowupEvents(
  supabase: SupabaseClient,
  tenantId: number,
  followupDays = DEFAULT_QUOTE_FOLLOWUP_DAYS,
): Promise<ScheduleResult> {
  const result: ScheduleResult = {
    scanned: 0,
    emitted: 0,
    duplicates: 0,
    errors: [],
  };

  const cutoff = new Date(
    Date.now() - followupDays * 86_400_000,
  ).toISOString();

  const { data: offertes } = await supabase
    .from("offertes")
    .select("id")
    .eq("bedrijf_id", tenantId)
    .in("status_new", ["verzonden", "bekeken"])
    .not("sent_at", "is", null)
    .lte("sent_at", cutoff)
    .order("sent_at", { ascending: true })
    .limit(50);

  for (const row of offertes ?? []) {
    result.scanned += 1;

    const ctx = await buildQuoteFollowupContext(supabase, tenantId, row.id);
    if (!ctx) continue;

    const eligibility = isQuoteEligibleForFollowup(ctx, followupDays);
    if (!eligibility.eligible) continue;

    const idempotencyKey = buildIdempotencyKey([
      "quote.followup_due",
      tenantId,
      row.id,
      new Date().toISOString().slice(0, 10),
    ]);

    const emitted = await emitDomainEvent({
      supabase,
      eventType: "quote.followup_due",
      tenantId,
      entityType: "offerte",
      entityId: row.id,
      payload: {
        offerteNummer: ctx.nummer,
        klant: ctx.klant,
        daysSinceSent: ctx.daysSinceSent,
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

    const dispatch = await dispatchSingleEvent(supabase, emitted.dbId);
    if (!dispatch.ok && dispatch.error) {
      result.errors.push(dispatch.error);
    }
  }

  return result;
}

export async function scheduleQuoteFollowupForAllTenants(
  supabase: SupabaseClient,
): Promise<{ tenants: number; emitted: number; errors: string[] }> {
  const { data: companies } = await supabase
    .from("bedrijven")
    .select("id")
    .limit(500);

  let emitted = 0;
  const errors: string[] = [];

  for (const company of companies ?? []) {
    const result = await scheduleQuoteFollowupEvents(supabase, company.id);
    emitted += result.emitted;
    errors.push(...result.errors);
  }

  return { tenants: companies?.length ?? 0, emitted, errors };
}
