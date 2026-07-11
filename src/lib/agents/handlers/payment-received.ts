import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoredDomainEvent } from "@/lib/agents/events/types";
import { createAgentRun, updateAgentRun } from "@/lib/agents/events/store";
import { writeAuditEntry, writeAgentActivity } from "@/lib/agents/audit";

const AGENT_ID = "Lima";

/** Cancels pending incasso proposals when payment is received. */
export async function handlePaymentReceived(
  supabase: SupabaseClient,
  event: StoredDomainEvent,
  eventDbId: string,
): Promise<{ ok: boolean; cancelled?: number; error?: string }> {
  const runId = await createAgentRun(supabase, {
    tenantId: event.tenantId,
    agentId: AGENT_ID,
    eventDbId,
    correlationId: event.correlationId,
    status: "analyzing",
    inputRef: { eventType: event.eventType, entityId: event.entityId },
  });

  if (!runId) return { ok: false, error: "Agent run kon niet worden aangemaakt" };

  try {
    const factuurId = event.entityId;
    const amount = event.payload.amount as number | undefined;
    const source = event.payload.source as string | undefined;

    const { data: pending } = await supabase
      .from("agent_actions")
      .select("id, action_type, title")
      .eq("company_id", event.tenantId)
      .eq("target_entity_type", "factuur")
      .eq("target_entity_id", factuurId)
      .eq("status", "pending");

    const now = new Date().toISOString();
    let cancelled = 0;

    for (const action of pending ?? []) {
      const { data: updated } = await supabase
        .from("agent_actions")
        .update({
          status: "rejected",
          rejected_at: now,
          reason: "Automatisch geannuleerd: betaling ontvangen",
          updated_at: now,
        })
        .eq("id", action.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (updated) cancelled += 1;
    }

    await writeAuditEntry(supabase, {
      tenantId: event.tenantId,
      correlationId: event.correlationId,
      actorType: "agent",
      actorId: AGENT_ID,
      action: "payment.received.processed",
      entityType: "factuur",
      entityId: factuurId,
      metadata: { amount, source, cancelledActions: cancelled },
    });

    if (cancelled > 0) {
      await writeAgentActivity(supabase, {
        companyId: event.tenantId,
        agentName: AGENT_ID,
        actionType: "payment_received",
        message: `Betaling ontvangen — ${cancelled} open incassovoorstel${cancelled === 1 ? "" : "len"} geannuleerd`,
        outputJson: { factuurId, cancelled },
      });
    }

    await updateAgentRun(supabase, runId, {
      status: "completed",
      outputRef: { cancelled },
      completed: true,
    });

    return { ok: true, cancelled };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    await updateAgentRun(supabase, runId, {
      status: "failed",
      error: msg,
      completed: true,
    });
    return { ok: false, error: msg };
  }
}
