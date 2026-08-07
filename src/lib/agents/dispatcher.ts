import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { StoredDomainEvent } from "@/lib/agents/events/types";
import { getPrimaryAgent } from "@/lib/agents/router";
import {
  isSelfTriggered,
  exceedsCorrelationLimit,
} from "@/lib/agents/events/dedup";
import {
  fetchUnprocessedEvents,
  markEventProcessed,
} from "@/lib/agents/events/store";
import { handleQuoteFollowupDue } from "@/lib/agents/handlers/quote-followup-due";
import { handleInvoiceOverdue } from "@/lib/agents/handlers/invoice-overdue";
import { handlePaymentReceived } from "@/lib/agents/handlers/payment-received";
import { writeAuditEntry } from "@/lib/agents/audit";

type TypedSupabase = SupabaseClient<Database>;

export type DispatchResult = {
  processed: number;
  skipped: number;
  errors: string[];
};

export type DispatchOpts = {
  autoExecuteUserId?: string | null;
};

async function countCorrelationActions(
  supabase: TypedSupabase,
  tenantId: number,
  correlationId: string,
): Promise<number> {
  const { count } = await supabase
    .from("agent_runs")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("correlation_id", correlationId);

  return count ?? 0;
}

async function dispatchEvent(
  supabase: TypedSupabase,
  event: StoredDomainEvent,
  opts?: DispatchOpts,
): Promise<{ ok: boolean; error?: string }> {
  const primary = getPrimaryAgent(event.eventType);
  if (!primary) {
    await markEventProcessed(supabase, event.id);
    return { ok: true };
  }

  const loopSafeEvents = new Set(["quote.followup_due", "invoice.overdue"]);
  if (
    isSelfTriggered(event.originAgentId, primary) &&
    !loopSafeEvents.has(event.eventType)
  ) {
    await markEventProcessed(supabase, event.id);
    return { ok: true };
  }

  const actionCount = await countCorrelationActions(
    supabase,
    event.tenantId,
    event.correlationId,
  );
  if (exceedsCorrelationLimit(actionCount)) {
    await writeAuditEntry(supabase, {
      tenantId: event.tenantId,
      correlationId: event.correlationId,
      actorType: "system",
      action: "agent.correlation_limit",
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: { eventType: event.eventType },
    });
    await markEventProcessed(supabase, event.id);
    return { ok: true };
  }

  switch (event.eventType) {
    case "quote.followup_due": {
      const result = await handleQuoteFollowupDue(supabase, event, event.id);
      await markEventProcessed(supabase, event.id);
      if (!result.ok && result.error) return { ok: false, error: result.error };
      return { ok: true };
    }
    case "invoice.overdue": {
      const result = await handleInvoiceOverdue(supabase, event, event.id, {
        autoExecuteUserId: opts?.autoExecuteUserId,
      });
      await markEventProcessed(supabase, event.id);
      if (!result.ok && result.error) return { ok: false, error: result.error };
      return { ok: true };
    }
    case "payment.received": {
      const result = await handlePaymentReceived(supabase, event, event.id);
      await markEventProcessed(supabase, event.id);
      if (!result.ok && result.error) return { ok: false, error: result.error };
      return { ok: true };
    }
    default:
      await markEventProcessed(supabase, event.id);
      return { ok: true };
  }
}

export async function dispatchPendingEvents(
  supabase: TypedSupabase,
  tenantId: number,
  opts?: DispatchOpts,
): Promise<DispatchResult> {
  const events = await fetchUnprocessedEvents(supabase, tenantId);
  const result: DispatchResult = { processed: 0, skipped: 0, errors: [] };

  for (const event of events) {
    const outcome = await dispatchEvent(supabase, event, opts);
    if (outcome.ok) {
      result.processed += 1;
    } else {
      result.errors.push(outcome.error ?? "Onbekende fout");
    }
  }

  return result;
}

export async function dispatchSingleEvent(
  supabase: TypedSupabase,
  eventDbId: string,
  opts?: DispatchOpts,
): Promise<{ ok: boolean; error?: string }> {
  const { data } = await supabase
    .from("domain_events")
    .select("*")
    .eq("id", eventDbId)
    .maybeSingle();

  if (!data) return { ok: false, error: "Event niet gevonden" };

  const event: StoredDomainEvent = {
    id: data.id,
    eventId: data.event_id,
    eventType: data.event_type as StoredDomainEvent["eventType"],
    tenantId: data.tenant_id,
    entityType: data.entity_type,
    entityId: data.entity_id,
    actorType: data.actor_type as StoredDomainEvent["actorType"],
    actorId: data.actor_id,
    occurredAt: data.occurred_at,
    correlationId: data.correlation_id,
    causationId: data.causation_id,
    originAgentId: data.origin_agent_id,
    payloadVersion: data.payload_version,
    payload: (data.payload ?? {}) as Record<string, unknown>,
    idempotencyKey: data.idempotency_key,
    processedAt: data.processed_at,
    createdAt: data.created_at,
  };

  return dispatchEvent(supabase, event, opts);
}
