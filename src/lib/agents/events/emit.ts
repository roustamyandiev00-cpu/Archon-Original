import type { SupabaseClient } from "@supabase/supabase-js";
import type { DomainEvent, DomainEventType } from "@/lib/agents/events/types";
import { storeDomainEvent } from "@/lib/agents/events/store";

export function newEventId(): string {
  return crypto.randomUUID();
}

export function newCorrelationId(): string {
  return crypto.randomUUID();
}

type EmitInput = {
  supabase: SupabaseClient;
  eventType: DomainEventType;
  tenantId: number;
  entityType: string;
  entityId: number;
  actorType?: DomainEvent["actorType"];
  actorId?: string | null;
  correlationId?: string;
  causationId?: string | null;
  originAgentId?: string | null;
  payload?: Record<string, unknown>;
  idempotencyKey?: string | null;
};

export async function emitDomainEvent(
  input: EmitInput,
): Promise<
  | { eventId: string; dbId: string; duplicate?: false }
  | { duplicate: true }
  | { error: string }
> {
  const event: DomainEvent = {
    eventId: newEventId(),
    eventType: input.eventType,
    tenantId: input.tenantId,
    entityType: input.entityType,
    entityId: input.entityId,
    actorType: input.actorType ?? "system",
    actorId: input.actorId ?? null,
    occurredAt: new Date().toISOString(),
    correlationId: input.correlationId ?? newCorrelationId(),
    causationId: input.causationId ?? null,
    originAgentId: input.originAgentId ?? null,
    payloadVersion: 1,
    payload: input.payload ?? {},
    idempotencyKey: input.idempotencyKey ?? null,
  };

  const stored = await storeDomainEvent(input.supabase, event);
  if ("duplicate" in stored && stored.duplicate) return { duplicate: true };
  if ("error" in stored) return { error: stored.error };
  if (!("id" in stored)) return { error: "Event opslaan mislukt." };

  return { eventId: event.eventId, dbId: stored.id };
}
