"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { parseExtras } from "@/app/dashboard/instellingen/settings";
import { loadMergedAiConfig } from "@/lib/agents/companyAi";
import { generateNovaOfferteDraft } from "@/lib/agents/nova";
import { proposeAgentAction } from "@/lib/agents/propose";
import { executeAgentAction } from "@/lib/agents/executor";
import { createOfferte } from "@/app/dashboard/offertes/actions";
import type { CreateOffertePayload } from "@/lib/agents/types";

function defaultGeldigTot() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export async function requestNovaOfferte(input: {
  description: string;
  customerId?: number | null;
  klant?: string;
  images?: string[];
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const ai = await loadMergedAiConfig(supabase, companyId, user.id);

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select("ai_assistant")
    .eq("id", companyId)
    .maybeSingle();
  const extras = parseExtras(bedrijf?.ai_assistant ?? null);

  let klant = input.klant?.trim() || "Klant";
  if (input.customerId) {
    const { data: customer } = await supabase
      .from("customers")
      .select("name, company_name")
      .eq("id", input.customerId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (customer) {
      klant = customer.company_name || customer.name || klant;
    }
  }

  const { draft, error: aiError } = await generateNovaOfferteDraft({
    description: input.description,
    klant,
    ai,
    standaardBtw: extras.standaardBtw,
    images: input.images,
  });

  if (!draft) {
    const name = ai.agentNaam.trim() || "Nova";
    return { error: aiError ?? `${name} kon geen voorstel maken.` };
  }

  const payload: CreateOffertePayload = {
    customerId: input.customerId ?? null,
    klant: draft.klant || klant,
    datum: new Date().toISOString().slice(0, 10),
    geldigTot: defaultGeldigTot(),
    notes: draft.notes || input.description,
    lines: draft.lines,
    description: input.description,
  };

  const agentName = ai.agentNaam.trim() || "Nova";
  const title = `${agentName}: offerte voor ${payload.klant}`;

  if (ai.toestemming === "versturen") {
    const created = await createOfferte(payload);
    if ("error" in created && created.error) {
      return { error: created.error };
    }
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/offertes");
    return {
      ok: true,
      mode: "direct" as const,
      offerteId: created.id,
      summary: draft.summary,
      aiWarning: aiError,
    };
  }

  const proposed = await proposeAgentAction({
    supabase,
    companyId,
    agentName,
    actionType: "create_offerte",
    title,
    reason: draft.summary,
    payload,
    requiresApproval: true,
  });

  if ("error" in proposed && proposed.error) {
    return { error: proposed.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/automatisaties");
  return {
    ok: true,
    mode: "pending" as const,
    actionId: proposed.id,
    summary: draft.summary,
    preview: payload,
    aiWarning: aiError,
  };
}

export async function approveAndExecuteAction(actionId: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const now = new Date().toISOString();
  const { error: patchError } = await supabase
    .from("agent_actions")
    .update({
      status: "approved",
      approved_at: now,
      approved_by: user.id,
      updated_at: now,
    })
    .eq("id", actionId)
    .eq("company_id", companyId);

  if (patchError) return { error: patchError.message };

  const result = await executeAgentAction({
    supabase,
    companyId,
    userId: user.id,
    actionId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/automatisaties");
  revalidatePath("/dashboard/offertes");
  revalidatePath("/dashboard/facturen");

  return result;
}
