import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/types/database.types";

export type AuditInput = {
  tenantId: number;
  correlationId: string;
  actorType: "user" | "agent" | "system";
  actorId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | number | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditEntry(
  supabase: SupabaseClient,
  input: AuditInput,
): Promise<void> {
  await supabase.from("audit_logs").insert({
    company_id: input.tenantId,
    event_type: input.action,
    event_category: "agent",
    severity: "info",
    actor_id: input.actorId ?? null,
    target_type: input.entityType ?? null,
    target_id: input.entityId != null ? String(input.entityId) : null,
    metadata: {
      correlationId: input.correlationId,
      actorType: input.actorType,
      before: input.before ?? null,
      after: input.after ?? null,
      ...input.metadata,
    } as Json,
  });
}

export async function writeAgentActivity(
  supabase: SupabaseClient,
  input: {
    companyId: number;
    userId?: string | null;
    agentName: string;
    actionType: string;
    message: string;
    inputJson?: Record<string, unknown>;
    outputJson?: Record<string, unknown>;
    error?: string;
  },
): Promise<void> {
  await supabase.from("agent_activity_logs").insert({
    company_id: input.companyId,
    created_by_user_id: input.userId ?? null,
    agent_name: input.agentName,
    action_type: input.actionType,
    message: input.message,
    input_json: (input.inputJson ?? null) as Json,
    output_json: (input.outputJson ?? null) as Json,
    error_message: input.error ?? null,
  });
}
