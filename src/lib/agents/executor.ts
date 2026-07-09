"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import {
  createOfferte,
  type CreateOfferteInput,
} from "@/app/dashboard/offertes/actions";
import { convertOfferteToFactuur } from "@/app/dashboard/offertes/convert-actions";
import { markOfferteSent } from "@/app/dashboard/offertes/send-actions";
import type {
  CreateInvoiceFromOffertePayload,
  CreateOffertePayload,
  SendOffertePayload,
} from "@/lib/agents/types";

async function logActivity(
  supabase: SupabaseClient,
  input: {
    companyId: number;
    userId: string;
    actionType: string;
    agentName: string;
    message: string;
    inputJson?: Record<string, unknown>;
    outputJson?: Record<string, unknown>;
    error?: string;
  },
) {
  await supabase.from("agent_activity_logs").insert({
    company_id: input.companyId,
    created_by_user_id: input.userId,
    agent_name: input.agentName,
    action_type: input.actionType,
    message: input.message,
    input_json: input.inputJson ?? null,
    output_json: input.outputJson ?? null,
    error_message: input.error ?? null,
  });
}

export async function executeAgentAction(input: {
  supabase: SupabaseClient;
  companyId: number;
  userId: string;
  actionId: number;
}) {
  const { supabase, companyId, userId, actionId } = input;

  const { data: action, error } = await supabase
    .from("agent_actions")
    .select("*")
    .eq("id", actionId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error || !action) {
    return { error: error?.message ?? "Actie niet gevonden." };
  }

  if (action.status !== "approved") {
    return { error: "Alleen goedgekeurde acties kunnen uitgevoerd worden." };
  }

  if (action.executed_at) {
    return { ok: true, route: action.target_route ?? undefined };
  }

  const agentName = action.agent_name || "Nova";
  const payload = (action.payload_json ?? {}) as Record<string, unknown>;

  try {
    if (action.action_type === "create_offerte") {
      const p = payload as unknown as CreateOffertePayload;
      const createInput: CreateOfferteInput = {
        customerId: p.customerId ?? null,
        klant: p.klant,
        datum: p.datum,
        geldigTot: p.geldigTot,
        notes: p.notes,
        lines: p.lines,
      };
      const result = await createOfferte(createInput);
      if ("error" in result && result.error) {
        throw new Error(result.error);
      }
      const offerteId = result.id as number;
      const route = `/dashboard/offertes/${offerteId}`;

      await supabase
        .from("agent_actions")
        .update({
          executed_at: new Date().toISOString(),
          target_entity_type: "offerte",
          target_entity_id: offerteId,
          target_route: route,
          updated_at: new Date().toISOString(),
        })
        .eq("id", actionId);

      await logActivity(supabase, {
        companyId,
        userId,
        agentName,
        actionType: action.action_type,
        message: `Offerte aangemaakt: ${p.klant}`,
        outputJson: { offerteId },
      });

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/offertes");
      revalidatePath("/dashboard/automatisaties");
      return { ok: true, offerteId, route };
    }

    if (action.action_type === "send_offerte") {
      const p = payload as unknown as SendOffertePayload;
      const send = await markOfferteSent(p.offerteId, {
        recipientEmail: p.recipientEmail ?? null,
        channel: "agent",
      });
      if ("error" in send && send.error) {
        throw new Error(send.error);
      }

      await supabase
        .from("agent_actions")
        .update({
          executed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", actionId);

      await logActivity(supabase, {
        companyId,
        userId,
        agentName,
        actionType: action.action_type,
        message: `Offerte #${p.offerteId} gemarkeerd als verzonden`,
        outputJson: { offerteId: p.offerteId },
      });

      revalidatePath("/dashboard/offertes");
      revalidatePath(`/dashboard/offertes/${p.offerteId}`);
      return { ok: true, offerteId: p.offerteId };
    }

    if (action.action_type === "create_invoice_from_offerte") {
      const p = payload as unknown as CreateInvoiceFromOffertePayload;
      const result = await convertOfferteToFactuur(p.offerteId);
      if ("error" in result && result.error) {
        throw new Error(result.error);
      }
      const factuurId = result.id as number;
      const route = `/dashboard/facturen/${factuurId}`;

      await supabase
        .from("agent_actions")
        .update({
          executed_at: new Date().toISOString(),
          target_entity_type: "factuur",
          target_entity_id: factuurId,
          target_route: route,
          updated_at: new Date().toISOString(),
        })
        .eq("id", actionId);

      await logActivity(supabase, {
        companyId,
        userId,
        agentName,
        actionType: action.action_type,
        message: `Factuur aangemaakt vanuit offerte #${p.offerteId}`,
        outputJson: { factuurId, offerteId: p.offerteId },
      });

      revalidatePath("/dashboard/facturen");
      return { ok: true, factuurId, route };
    }

    return { error: `Onbekend actietype: ${action.action_type}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Uitvoering mislukt.";
    await logActivity(supabase, {
      companyId,
      userId,
      agentName,
      actionType: action.action_type,
      message: "Uitvoering mislukt",
      error: msg,
    });
    return { error: msg };
  }
}
