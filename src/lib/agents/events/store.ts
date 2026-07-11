import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/types/database.types";
import type { DomainEvent, StoredDomainEvent } from "@/lib/agents/events/types";
import { untyped } from "@/lib/integraties";

type DomainEventRow = {
  id: string;
  event_id: string;
  event_type: string;
  tenant_id: number;
  entity_type: string;
  entity_id: number;
  actor_type: string;
  actor_id: string | null;
  occurred_at: string;
  correlation_id: string;
  causation_id: string | null;
  origin_agent_id: string | null;
  payload_version: number;
  payload: Json;
  processed_at: string | null;
  idempotency_key: string | null;
  created_at: string;
};

function rowToEvent(row: DomainEventRow): StoredDomainEvent {
  return {
    id: row.id,
    eventId: row.event_id,
    eventType: row.event_type as StoredDomainEvent["eventType"],
    tenantId: row.tenant_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actorType: row.actor_type as StoredDomainEvent["actorType"],
    actorId: row.actor_id,
    occurredAt: row.occurred_at,
    correlationId: row.correlation_id,
    causationId: row.causation_id,
    originAgentId: row.origin_agent_id,
    payloadVersion: row.payload_version,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    idempotencyKey: row.idempotency_key,
    processedAt: row.processed_at,
    createdAt: row.created_at,
  };
}

export async function storeDomainEvent(
  supabase: SupabaseClient,
  event: DomainEvent,
): Promise<{ id: string } | { duplicate: true } | { error: string }> {
  if (event.idempotencyKey) {
    const { data: existing } = await untyped(supabase)
      .from("domain_events")
      .select("id")
      .eq("tenant_id", event.tenantId)
      .eq("idempotency_key", event.idempotencyKey)
      .maybeSingle();

    if (existing) return { duplicate: true };
  }

  const { data, error } = await untyped(supabase)
    .from("domain_events")
    .insert({
      event_id: event.eventId,
      event_type: event.eventType,
      tenant_id: event.tenantId,
      entity_type: event.entityType,
      entity_id: event.entityId,
      actor_type: event.actorType,
      actor_id: event.actorId ?? null,
      occurred_at: event.occurredAt,
      correlation_id: event.correlationId,
      causation_id: event.causationId ?? null,
      origin_agent_id: event.originAgentId ?? null,
      payload_version: event.payloadVersion,
      payload: event.payload as Json,
      idempotency_key: event.idempotencyKey ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { duplicate: true };
    return { error: error.message };
  }

  return { id: data.id as string };
}

export async function markEventProcessed(
  supabase: SupabaseClient,
  eventDbId: string,
): Promise<void> {
  await untyped(supabase)
    .from("domain_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", eventDbId);
}

export async function fetchUnprocessedEvents(
  supabase: SupabaseClient,
  tenantId: number,
  limit = 20,
): Promise<StoredDomainEvent[]> {
  const { data } = await untyped(supabase)
    .from("domain_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("processed_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  return ((data ?? []) as DomainEventRow[]).map(rowToEvent);
}

export async function createAgentRun(
  supabase: SupabaseClient,
  input: {
    tenantId: number;
    agentId: string;
    eventDbId?: string;
    correlationId: string;
    status?: string;
    inputRef?: Record<string, unknown>;
  },
): Promise<string | null> {
  const { data, error } = await untyped(supabase)
    .from("agent_runs")
    .insert({
      tenant_id: input.tenantId,
      agent_id: input.agentId,
      event_id: input.eventDbId ?? null,
      correlation_id: input.correlationId,
      status: input.status ?? "detected",
      input_ref: (input.inputRef ?? null) as Json,
    })
    .select("id")
    .single();

  if (error) return null;
  return data.id as string;
}

export async function updateAgentRun(
  supabase: SupabaseClient,
  runId: string,
  patch: {
    status?: string;
    outputRef?: Record<string, unknown>;
    error?: string;
    completed?: boolean;
  },
): Promise<void> {
  await untyped(supabase)
    .from("agent_runs")
    .update({
      status: patch.status,
      output_ref: (patch.outputRef ?? undefined) as Json | undefined,
      error: patch.error,
      completed_at: patch.completed ? new Date().toISOString() : undefined,
    })
    .eq("id", runId);
}
