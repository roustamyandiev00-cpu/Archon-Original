import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoredDomainEvent } from "@/lib/agents/events/types";
import type { AgentActionType } from "@/lib/agents/types";
import { buildIdempotencyKey } from "@/lib/agents/events/dedup";
import { evaluatePolicy } from "@/lib/agents/policy";
import { validateStructuredOutput } from "@/lib/agents/schema";
import {
  buildInvoiceOverdueContext,
  incassoReason,
  incassoTitle,
  isInvoiceEligibleForReminder,
} from "@/lib/agents/context/invoice-overdue";
import { proposeAgentAction } from "@/lib/agents/propose";
import { executeAgentAction } from "@/lib/agents/executor";
import { writeAuditEntry, writeAgentActivity } from "@/lib/agents/audit";
import { createAgentRun, updateAgentRun } from "@/lib/agents/events/store";
import { loadMergedAiConfig } from "@/lib/agents/companyAi";

const AGENT_ID = "Lima";

export async function handleInvoiceOverdue(
  supabase: SupabaseClient,
  event: StoredDomainEvent,
  eventDbId: string,
  opts?: { autoExecuteUserId?: string | null },
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
    const ctx = await buildInvoiceOverdueContext(
      supabase,
      event.tenantId,
      event.entityId,
    );

    if (!ctx) {
      await updateAgentRun(supabase, runId, {
        status: "failed",
        error: "Factuur niet gevonden",
        completed: true,
      });
      return { ok: false, error: "Factuur niet gevonden" };
    }

    const eligibility = isInvoiceEligibleForReminder(ctx);
    if (!eligibility.eligible) {
      await updateAgentRun(supabase, runId, {
        status: "completed",
        outputRef: { skipped: eligibility.reason },
        completed: true,
      });
      return { ok: true, skipped: eligibility.reason };
    }

    const actionType = ctx.actionType as AgentActionType;
    const policy = evaluatePolicy({
      agentId: AGENT_ID,
      actionType,
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

    const { data: existing } = await supabase
      .from("agent_actions")
      .select("id")
      .eq("company_id", event.tenantId)
      .eq("status", "pending")
      .eq("target_entity_id", ctx.factuurId)
      .eq("target_entity_type", "factuur")
      .maybeSingle();

    if (existing) {
      await updateAgentRun(supabase, runId, {
        status: "completed",
        outputRef: { duplicate: true, actionId: existing.id },
        completed: true,
      });
      return { ok: true, actionId: existing.id, skipped: "Dubbel voorstel voorkomen" };
    }

    const idempotencyKey = buildIdempotencyKey([
      actionType,
      event.tenantId,
      ctx.factuurId,
      ctx.stage,
      "v1",
    ]);

    const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const title = incassoTitle(ctx);
    const reason = incassoReason(ctx);

    const structured = {
      agentId: AGENT_ID,
      actionType,
      entityType: "factuur",
      entityId: ctx.factuurId,
      summary: title,
      reason,
      evidence: ctx.timeline.map((t) => ({
        sourceType: "timeline",
        sourceId: ctx.factuurId,
        snapshot: t.detail,
        observedAt: t.at,
      })),
      riskLevel: ctx.stage === "deurwaarder" ? "high" as const : policy.riskLevel,
      confidence: ctx.stage === "deurwaarder" ? 0.92 : 0.88,
      autonomyLevel: policy.autonomyLevel,
      requiresApproval: ctx.stage === "deurwaarder" || policy.requiresApproval,
      communicationIntent: ctx.draftBody
        ? {
            channel: "email",
            draftMessage: ctx.draftBody,
            recipientEmail: ctx.customerEmail,
          }
        : undefined,
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
      return { ok: false, error: validation.errors.join("; ") };
    }

    let requiresApproval =
      ctx.stage === "deurwaarder" || policy.requiresApproval;

    if (opts?.autoExecuteUserId) {
      const ai = await loadMergedAiConfig(
        supabase,
        event.tenantId,
        opts.autoExecuteUserId,
      );
      if (ai.toestemming === "versturen" && ctx.stage !== "deurwaarder") {
        requiresApproval = false;
      }
    }

    const proposed = await proposeAgentAction({
      supabase,
      companyId: event.tenantId,
      agentName: AGENT_ID,
      actionType,
      title,
      reason,
      payload: {
        factuurId: ctx.factuurId,
        stage: ctx.stage!,
        _meta: {
          riskLevel: structured.riskLevel,
          autonomyLevel: structured.autonomyLevel,
          expiresAt,
          idempotencyKey,
          correlationId: event.correlationId,
          evidence: structured.evidence,
          communicationIntent: structured.communicationIntent,
          impact: "external",
          draftSubject: ctx.draftSubject,
          draftBody: ctx.draftBody,
        },
      },
      targetEntityType: "factuur",
      targetEntityId: ctx.factuurId,
      targetRoute: `/dashboard/facturen/${ctx.factuurId}`,
      requiresApproval,
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
      entityType: "factuur",
      entityId: ctx.factuurId,
      after: { actionId: proposed.id, actionType, stage: ctx.stage },
      metadata: { policy, eventId: event.eventId },
    });

    if (!requiresApproval && opts?.autoExecuteUserId) {
      const now = new Date().toISOString();
      await supabase
        .from("agent_actions")
        .update({
          status: "approved",
          approved_at: now,
          approved_by: opts.autoExecuteUserId,
          updated_at: now,
        })
        .eq("id", proposed.id)
        .eq("status", "pending");

      await executeAgentAction({
        supabase,
        companyId: event.tenantId,
        userId: opts.autoExecuteUserId,
        actionId: proposed.id,
      });
    }

    await writeAgentActivity(supabase, {
      companyId: event.tenantId,
      userId: opts?.autoExecuteUserId,
      agentName: AGENT_ID,
      actionType,
      message: `Incassovoorstel: ${title}`,
      outputJson: { actionId: proposed.id, stage: ctx.stage },
    });

    await updateAgentRun(supabase, runId, {
      status: requiresApproval ? "proposed" : "completed",
      outputRef: { actionId: proposed.id, autoExecuted: !requiresApproval },
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
