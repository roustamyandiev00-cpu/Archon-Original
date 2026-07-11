export const DOMAIN_EVENT_TYPES = [
  "lead.created",
  "lead.updated",
  "contact.updated",
  "quote.created",
  "quote.sent",
  "quote.viewed",
  "quote.followup_due",
  "invoice.created",
  "invoice.overdue",
  "payment.received",
  "project.deadline_approaching",
  "integration.failed",
] as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];

export type ActorType = "user" | "agent" | "system" | "integration";

export type DomainEventPayload = Record<string, unknown>;

export type DomainEvent = {
  eventId: string;
  eventType: DomainEventType;
  tenantId: number;
  entityType: string;
  entityId: number;
  actorType: ActorType;
  actorId?: string | null;
  occurredAt: string;
  correlationId: string;
  causationId?: string | null;
  originAgentId?: string | null;
  payloadVersion: number;
  payload: DomainEventPayload;
  idempotencyKey?: string | null;
};

export type StoredDomainEvent = DomainEvent & {
  id: string;
  processedAt?: string | null;
  createdAt: string;
};
