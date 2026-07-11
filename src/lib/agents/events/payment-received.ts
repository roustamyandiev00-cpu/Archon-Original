import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActorType } from "@/lib/agents/events/types";
import { emitDomainEvent } from "@/lib/agents/events/emit";
import { dispatchSingleEvent } from "@/lib/agents/dispatcher";
import { buildIdempotencyKey } from "@/lib/agents/events/dedup";

export type PaymentReceivedSource = "bank_match" | "manual";

export function paymentReceivedIdempotencyKey(input: {
  tenantId: number;
  factuurId: number;
  source: PaymentReceivedSource;
  referenceId?: string | number;
}): string {
  return buildIdempotencyKey([
    "payment.received",
    input.tenantId,
    input.factuurId,
    input.source,
    input.referenceId ?? "once",
  ]);
}

/** Emit payment.received and dispatch Lima handler (cancel open incasso proposals). */
export async function notifyPaymentReceived(
  supabase: SupabaseClient,
  input: {
    tenantId: number;
    factuurId: number;
    amount: number;
    source: PaymentReceivedSource;
    actorType: ActorType;
    actorId?: string | null;
    referenceId?: string | number;
    betaalmethode?: string;
  },
): Promise<{ ok: true; duplicate?: boolean } | { error: string }> {
  const idempotencyKey = paymentReceivedIdempotencyKey({
    tenantId: input.tenantId,
    factuurId: input.factuurId,
    source: input.source,
    referenceId: input.referenceId,
  });

  const emitted = await emitDomainEvent({
    supabase,
    eventType: "payment.received",
    tenantId: input.tenantId,
    entityType: "factuur",
    entityId: input.factuurId,
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    payload: {
      amount: input.amount,
      source: input.source,
      betaalmethode: input.betaalmethode ?? null,
      referenceId: input.referenceId ?? null,
    },
    idempotencyKey,
  });

  if ("duplicate" in emitted && emitted.duplicate) {
    return { ok: true, duplicate: true };
  }
  if ("error" in emitted) {
    return { error: emitted.error };
  }

  const dispatch = await dispatchSingleEvent(supabase, emitted.dbId);
  if (!dispatch.ok && dispatch.error) {
    return { error: dispatch.error };
  }

  return { ok: true };
}
