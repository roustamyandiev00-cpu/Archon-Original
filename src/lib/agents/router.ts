import type { DomainEventType } from "@/lib/agents/events/types";

export type AgentId = "Nova" | "Lima";

export type EventRoute = {
  primary: AgentId;
  observers?: AgentId[];
};

/** Deterministic event → agent routing. Testable without LLM. */
export const EVENT_ROUTES: Partial<Record<DomainEventType, EventRoute>> = {
  "lead.created": { primary: "Nova", observers: ["Lima"] },
  "lead.updated": { primary: "Nova" },
  "contact.updated": { primary: "Nova" },
  "quote.created": { primary: "Nova" },
  "quote.sent": { primary: "Nova" },
  "quote.viewed": { primary: "Nova" },
  "quote.followup_due": { primary: "Nova" },
  "invoice.created": { primary: "Lima" },
  "invoice.overdue": { primary: "Lima" },
  "payment.received": { primary: "Lima" },
  "project.deadline_approaching": { primary: "Nova", observers: ["Lima"] },
  "integration.failed": { primary: "Lima" },
};

export function routeEvent(eventType: DomainEventType): EventRoute | null {
  return EVENT_ROUTES[eventType] ?? null;
}

export function getPrimaryAgent(eventType: DomainEventType): AgentId | null {
  return EVENT_ROUTES[eventType]?.primary ?? null;
}
