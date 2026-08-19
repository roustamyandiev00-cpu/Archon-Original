import type { SupabaseClient } from "@supabase/supabase-js";
import { executeAgentAction } from "@/lib/agents/executor";
import { rememberFromExecution } from "@/components/dashboard/agents/memory";
import type { AgentActionType } from "@/lib/agents/types";
import type { AiToestemming } from "@/app/dashboard/instellingen/settings";

const ALWAYS_REQUIRE_APPROVAL: ReadonlySet<string> = new Set([
  "forward_to_bailiff",
]);

/** Acties die bij «versturen»-modus zonder menselijke goedkeuring mogen lopen. */
export function canAutoExecuteAction(
  actionType: string,
  toestemming: AiToestemming,
): boolean {
  if (toestemming !== "versturen") return false;
  if (ALWAYS_REQUIRE_APPROVAL.has(actionType)) return false;
  return true;
}

/**
 * Keur een pending agent_action goed en voer die uit wanneer
 * `ai.toestemming === "versturen"` (deurwaarder uitgezonderd).
 */
export async function autoExecuteIfAllowed(input: {
  supabase: SupabaseClient;
  companyId: number;
  userId: string;
  actionId: number;
  actionType: AgentActionType | string;
  toestemming: AiToestemming;
}): Promise<{ autoExecuted: boolean; error?: string }> {
  if (!canAutoExecuteAction(input.actionType, input.toestemming)) {
    return { autoExecuted: false };
  }

  const now = new Date().toISOString();
  const { error: patchError } = await input.supabase
    .from("agent_actions")
    .update({
      status: "approved",
      approved_at: now,
      approved_by: input.userId,
      updated_at: now,
    })
    .eq("id", input.actionId)
    .eq("company_id", input.companyId)
    .eq("status", "pending");

  if (patchError) {
    return { autoExecuted: false, error: patchError.message };
  }

  const result = await executeAgentAction({
    supabase: input.supabase,
    companyId: input.companyId,
    userId: input.userId,
    actionId: input.actionId,
  });

  if ("error" in result && result.error) {
    return { autoExecuted: false, error: result.error };
  }

  await rememberFromExecution(input.supabase, {
    companyId: input.companyId,
    userId: input.userId,
    actionId: input.actionId,
  });

  return { autoExecuted: true };
}
