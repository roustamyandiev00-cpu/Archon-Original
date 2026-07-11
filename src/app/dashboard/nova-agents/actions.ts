"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import {
  mergeAgents,
  validateAgent,
  type CustomAgent,
} from "@/components/dashboard/agents/config";
import { saveCompanyAgents } from "@/components/dashboard/agents/storage";

export async function saveAgents(agents: CustomAgent[]) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  for (const agent of agents) {
    const err = validateAgent(agent);
    if (err) return { error: `${agent.name || "Agent"}: ${err}` };
  }

  const merged = mergeAgents(agents);
  const error = await saveCompanyAgents(supabase, companyId, merged);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/command-center");
  revalidatePath("/dashboard/nova-agents");
  revalidatePath("/dashboard");
  return { ok: true, agents: merged };
}
