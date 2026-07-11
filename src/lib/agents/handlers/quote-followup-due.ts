import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoredDomainEvent } from "@/lib/agents/events/types";
import type { StructuredAgentOutput } from "@/lib/agents/schema";
import { buildIdempotencyKey } from "@/lib/agents/events/dedup";
import { evaluatePolicy } from "@/lib/agents/policy";
import { validateStructuredOutput } from "@/lib/agents/schema";
import {
  buildFollowupDraftMessage,
  buildQuoteFollowupContext,
  isQuoteEligibleForFollowup,
} from "@/lib/agents/context/quote-followup";
import { proposeAgentAction } from "@/lib/agents/propose";
import { writeAuditEntry, writeAgentActivity } from "@/lib/agents/audit";
import {
  createAgentRun,
  updateAgentRun,
} from "@/lib/agents/events/store";

const AGENT_ID = "Nova";
const ACTION_TYPE = "send_quote_followup";

export async function handleQuoteFollowupDue(
  supabase: SupabaseClient,
  event: StoredDomainEvent,
  eventDbId: string,
): Promise<{ ok: boolean; actionId?: number; error?: string; skipped?: string }> {
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
    const ctx = await buildQuoteFollowupContext(
      supabase,
      event.tenantId,
      event.entityId,
    );

    if (!ctx) {
      await updateAgentRun(supabase, runId, {
        status: "failed",
        error: "Offerte niet gevonden",
        completed: true,
      });
      return { ok: false, error: "Offerte niet gevonden" };
    }

    const eligibility = isQuoteEligibleForFollowup(ctx);
    if (!eligibility.eligible) {
      await updateAgentRun(supabase, runId, {
        status: "completed",
        outputRef: { skipped: eligibility.reason },
        completed: true,
      });
      return { ok: true, skipped: eligibility.reason };
    }

    const policy = evaluatePolicy({
      agentId: AGENT_ID,
      actionType: ACTION_TYPE,
      tenantId: event.tenantId,
      isExternal: true,
    });

    if (!policy.allowed) {
      await updateAgentRun(supabase, runId, {
        status: "failed",
        error: policy.reason,
        completed: true,
      });
      return { ok: false, error: policy.reason };
    }

    const idempotencyKey = buildIdempotencyKey([
      ACTION_TYPE,
      event.tenantId,
      ctx.offerteId,
      "v1",
    ]);

    const { data: existing } = await supabase
      .from("agent_actions")
      .select("id")
      .eq("company_id", event.tenantId)
      .eq("status", "pending")
      .eq("action_type", ACTION_TYPE)
      .eq("target_entity_id", ctx.offerteId)
      .maybeSingle();

    if (existing) {
      await updateAgentRun(supabase, runId, {
        status: "completed",
        outputRef: { duplicate: true, actionId: existing.id },
        completed: true,
      });
      return { ok: true, actionId: existing.id, skipped: "Dubbel voorstel voorkomen" };
    }

    const draftMessage = buildFollowupDraftMessage(ctx);
    const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();

    const structured: StructuredAgentOutput = {
      agentId: AGENT_ID,
      actionType: ACTION_TYPE,
      entityType: "offerte",
      entityId: ctx.offerteId,
      summary: `Opvolging offerte ${ctx.nummer} — ${ctx.klant}`,
      reason: `${ctx.klant} heeft ${ctx.daysSinceSent} dagen niet gereageerd op offerte ${ctx.nummer}.`,
      evidence: ctx.timeline.map((t) => ({
        sourceType: "timeline",
        sourceId: ctx.offerteId,
        snapshot: t.detail,
        observedAt: t.at,
      })),
      riskLevel: policy.riskLevel,
      confidence: 0.88,
      autonomyLevel: policy.autonomyLevel,
      requiresApproval: policy.requiresApproval,
      communicationIntent: {
        channel: "email",
        draftMessage,
        recipientEmail: ctx.customerEmail,
      },
      expiresAt,
      idempotencyKey,
      correlationId: event.correlationId,
    };

    const validation = validateStructuredOutput(structured);
    if (!validation.valid) {
      await updateAgentRun(supabase, runId, {
        status: "failed",
        error: validation.errors.join("; "),
        completed: true,
      });
      await writeAgentActivity(supabase, {
        companyId: event.tenantId,
        agentName: AGENT_ID,
        actionType: "validation_failed",
        message: `Ongeldige agentoutput: ${validation.errors.join(", ")}`,
        error: validation.errors.join("; "),
      });
      return { ok: false, error: validation.errors.join("; ") };
    }

    const proposed = await proposeAgentAction({
      supabase,
      companyId: event.tenantId,
      agentName: AGENT_ID,
      actionType: ACTION_TYPE,
      title: structured.summary,
      reason: structured.reason,
      payload: {
        offerteId: ctx.offerteId,
        draftMessage,
        recipientEmail: ctx.customerEmail,
        channel: "email",
        _meta: {
          riskLevel: structured.riskLevel,
          autonomyLevel: structured.autonomyLevel,
          expiresAt: structured.expiresAt,
          idempotencyKey: structured.idempotencyKey,
          correlationId: structured.correlationId,
          evidence: structured.evidence,
          communicationIntent: structured.communicationIntent,
          impact: "external",
        },
      },
      targetEntityType: "offerte",
      targetEntityId: ctx.offerteId,
      targetRoute: `/dashboard/offertes/${ctx.offerteId}`,
      requiresApproval: policy.requiresApproval,
      confidence: structured.confidence,
    });

    if ("error" in proposed) {
      await updateAgentRun(supabase, runId, {
        status: "failed",
        error: proposed.error,
        completed: true,
      });
      return { ok: false, error: proposed.error };
    }

    await writeAuditEntry(supabase, {
      tenantId: event.tenantId,
      correlationId: event.correlationId,
      actorType: "agent",
      actorId: AGENT_ID,
      action: "agent.proposed",
      entityType: "offerte",
      entityId: ctx.offerteId,
      after: { actionId: proposed.id, actionType: ACTION_TYPE },
      metadata: { policy, eventId: event.eventId },
    });

    await updateAgentRun(supabase, runId, {
      status: "proposed",
      outputRef: { actionId: proposed.id },
      completed: true,
    });

    return { ok: true, actionId: proposed.id };
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
