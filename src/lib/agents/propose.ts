import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/types/database.types";
import type {
  AgentActionType,
  CreateInvoiceFromOffertePayload,
  CreateOffertePayload,
  SendOffertePayload,
  SendPaymentReminderPayload,
} from "@/lib/agents/types";

type ProposeInput = {
  supabase: SupabaseClient;
  companyId: number;
  agentName: string;
  actionType: AgentActionType;
  title: string;
  reason?: string;
  payload: CreateOffertePayload | SendOffertePayload | CreateInvoiceFromOffertePayload | SendPaymentReminderPayload;
  targetEntityType?: string | null;
  targetEntityId?: number | null;
  targetRoute?: string | null;
  requiresApproval?: boolean;
  confidence?: number;
};

export async function proposeAgentAction(input: ProposeInput) {
  const { data, error } = await input.supabase
    .from("agent_actions")
    .insert({
      company_id: input.companyId,
      agent_name: input.agentName,
      action_type: input.actionType,
      title: input.title,
      reason: input.reason ?? null,
      payload_json: input.payload as unknown as Json,
      target_entity_type: input.targetEntityType ?? null,
      target_entity_id: input.targetEntityId ?? null,
      target_route: input.targetRoute ?? null,
      status: "pending",
      requires_approval: input.requiresApproval ?? true,
      confidence: input.confidence ?? 0.85,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id as number };
}
