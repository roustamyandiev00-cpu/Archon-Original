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
  ProposeChatSanctionPayload,
  ProposeWerkpostMatchPayload,
  ProposeGeschilSamenvattingPayload,
  SendOffertePayload,
  SendPaymentReminderPayload,
  SendQuoteFollowupPayload,
} from "@/lib/agents/types";
import { executeIncassoStep } from "@/app/dashboard/facturen/incasso-actions";
import { executeQuoteFollowup } from "@/lib/agents/followup-actions";
import { untyped } from "@/lib/integraties";
import { refreshBetrouwbaarheidsscore } from "@/lib/bouwnetwerk/betrouwbaarheid";

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

  const agentName = action.agent_name || "Lara";
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
        projectNaam: p.projectNaam ?? null,
        afmetingen: p.afmetingen ?? null,
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
          target_route: `/dashboard/offertes/${p.offerteId}`,
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
      return { ok: true, offerteId: p.offerteId, route: `/dashboard/offertes/${p.offerteId}` };
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

    if (action.action_type === "send_quote_followup") {
      const p = payload as unknown as SendQuoteFollowupPayload;
      const meta = (p._meta ?? {}) as Record<string, unknown>;

      const result = await executeQuoteFollowup({
        supabase,
        companyId,
        userId,
        payload: p,
        meta,
      });

      if ("error" in result && result.error) {
        if (result.blocked) {
          await supabase
            .from("agent_actions")
            .update({
              status: "rejected",
              rejected_at: new Date().toISOString(),
              reason: `${action.reason ?? ""} — geblokkeerd: ${result.error}`.trim(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", actionId);
        }
        throw new Error(result.error);
      }
      if (!("ok" in result) || !result.ok) {
        throw new Error("Opvolging mislukt.");
      }

      const route = `/dashboard/offertes/${p.offerteId}`;

      await supabase
        .from("agent_actions")
        .update({
          executed_at: new Date().toISOString(),
          target_entity_type: "offerte",
          target_entity_id: p.offerteId,
          target_route: route,
          updated_at: new Date().toISOString(),
        })
        .eq("id", actionId);

      await logActivity(supabase, {
        companyId,
        userId,
        agentName,
        actionType: action.action_type,
        message: `Opvolging offerte #${p.offerteId} ${result.sentViaSmtp ? "verzonden" : "voorbereid"}`,
        outputJson: {
          offerteId: p.offerteId,
          mailto: result.mailto,
          sentViaSmtp: result.sentViaSmtp,
        },
      });

      revalidatePath("/dashboard/offertes");
      revalidatePath(`/dashboard/offertes/${p.offerteId}`);
      revalidatePath("/dashboard/automatisaties");
      return {
        ok: true,
        offerteId: p.offerteId,
        route,
        mailto: result.mailto,
      };
    }

    if (
      action.action_type === "send_payment_reminder" ||
      action.action_type === "send_formal_notice" ||
      action.action_type === "forward_to_bailiff"
    ) {
      const p = payload as unknown as SendPaymentReminderPayload;
      const stage =
        p.stage ??
        (action.action_type === "forward_to_bailiff"
          ? "deurwaarder"
          : action.action_type === "send_formal_notice"
            ? "ingebrekestelling"
            : "herinnering");

      const result = await executeIncassoStep({
        supabase,
        companyId,
        userId,
        factuurId: p.factuurId,
        stage,
        agentName,
      });

      if ("error" in result && result.error) {
        throw new Error(result.error);
      }

      const route = result.route ?? `/dashboard/facturen/${p.factuurId}`;

      await supabase
        .from("agent_actions")
        .update({
          executed_at: new Date().toISOString(),
          target_entity_type: "factuur",
          target_entity_id: p.factuurId,
          target_route: route,
          updated_at: new Date().toISOString(),
        })
        .eq("id", actionId);

      await logActivity(supabase, {
        companyId,
        userId,
        agentName,
        actionType: action.action_type,
        message: `Incasso uitgevoerd voor factuur #${p.factuurId} (${stage})`,
        outputJson: {
          factuurId: p.factuurId,
          stage,
          mailto: "mailto" in result ? result.mailto : undefined,
          bailiffMailto:
            "bailiffMailto" in result ? result.bailiffMailto : undefined,
        },
      });

      revalidatePath("/dashboard/facturen");
      revalidatePath(`/dashboard/facturen/${p.factuurId}`);
      revalidatePath("/dashboard/automatisaties");
      revalidatePath("/dashboard/cron");
      return {
        ok: true,
        factuurId: p.factuurId,
        route,
        mailto: "mailto" in result ? result.mailto : undefined,
        bailiffMailto:
          "bailiffMailto" in result ? result.bailiffMailto : undefined,
      };
    }

    if (action.action_type === "propose_chat_sanction") {
      const p = payload as unknown as ProposeChatSanctionPayload;
      const isWarning = p.sanctionType === "waarschuwing";
      const sanctieStatus = isWarning ? "bevestigd" : "voorgesteld";

      const { data: sanctie, error: sanctieError } = await untyped(supabase)
        .from("bedrijf_sancties")
        .insert({
          bedrijf_id: p.bedrijfId,
          type: p.sanctionType,
          reden: p.reden,
          bewijs_agent_action_id: actionId,
          bevestigd_door: isWarning ? userId : null,
          status: sanctieStatus,
          channel_id: p.channelId || null,
          message_id: p.messageId || null,
          ingaat_op: isWarning ? new Date().toISOString() : null,
          verloopt_op: isWarning
            ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
            : null,
        })
        .select("id")
        .maybeSingle();

      if (sanctieError) throw new Error(sanctieError.message);

      if (isWarning) {
        await supabase
          .from("bedrijven")
          .update({
            risicostatus: "gewaarschuwd",
            updated_at: new Date().toISOString(),
          })
          .eq("id", p.bedrijfId)
          .eq("risicostatus", "normaal");
      }

      await refreshBetrouwbaarheidsscore(supabase, p.bedrijfId);

      const route =
        action.target_route ??
        `/dashboard/werkposts/samenwerkingen?channel=${p.channelId}`;

      await supabase
        .from("agent_actions")
        .update({
          executed_at: new Date().toISOString(),
          target_route: route,
          updated_at: new Date().toISOString(),
        })
        .eq("id", actionId);

      await logActivity(supabase, {
        companyId,
        userId,
        agentName,
        actionType: action.action_type,
        message: `Sanctie ${sanctieStatus}: ${p.sanctionType}`,
        outputJson: { sanctieId: sanctie?.id, sanctionType: p.sanctionType },
      });

      revalidatePath("/dashboard/automatisaties");
      revalidatePath("/admin/rapportages");
      return { ok: true, route };
    }

    if (action.action_type === "propose_werkpost_match") {
      const p = payload as unknown as ProposeWerkpostMatchPayload;
      const { assertCanAutoSendReactie, markAutoSendTimestamp } = await import(
        "@/lib/bouwnetwerk/send-guardrails"
      );

      const guard = await assertCanAutoSendReactie(supabase, {
        companyId,
        werkpostId: p.werkpostId,
      });

      let sent = false;
      let skipReason: string | undefined;
      if (!guard.ok) {
        skipReason = guard.reason;
      } else {
        const { error: reactieError } = await supabase
          .from("werkpost_reacties")
          .insert({
            werkpost_id: p.werkpostId,
            company_id: companyId,
            user_id: userId,
            bericht: p.draftMessage.trim(),
            voorgesteld_tarief: null,
            beschikbaarheid_vanaf: null,
            beschikbaarheid_tot: null,
            status: "in_afwachting",
          });
        if (reactieError) {
          skipReason = reactieError.message;
        } else {
          sent = true;
          await markAutoSendTimestamp(supabase, companyId);
          const { count } = await supabase
            .from("werkpost_reacties")
            .select("id", { count: "exact", head: true })
            .eq("werkpost_id", p.werkpostId);
          await supabase
            .from("werkposts")
            .update({
              aantal_reacties: count ?? 0,
              pipeline_status: "interesse_verstuurd",
              updated_at: new Date().toISOString(),
            })
            .eq("id", p.werkpostId);
        }
      }

      if (!sent) {
        await supabase
          .from("werkposts")
          .update({
            pipeline_status: "interesse_verstuurd",
            updated_at: new Date().toISOString(),
          })
          .eq("id", p.werkpostId);
      }

      const route = `/bouwnetwerk`;
      await supabase
        .from("agent_actions")
        .update({
          executed_at: new Date().toISOString(),
          target_route: route,
          updated_at: new Date().toISOString(),
        })
        .eq("id", actionId);

      await logActivity(supabase, {
        companyId,
        userId,
        agentName,
        actionType: action.action_type,
        message: sent
          ? `Reactie verstuurd op «${p.werkpostTitel}» (na goedkeuring)`
          : `Match goedgekeurd zonder auto-send: ${skipReason ?? "onbekend"}`,
        outputJson: {
          werkpostId: p.werkpostId,
          draftMessage: p.draftMessage,
          sent,
          skipReason,
        },
      });

      revalidatePath("/dashboard/automatisaties");
      revalidatePath("/bouwnetwerk");
      revalidatePath("/dashboard/werkposts");
      return { ok: true, route };
    }

    if (action.action_type === "propose_geschil_samenvatting") {
      const p = payload as unknown as ProposeGeschilSamenvattingPayload;
      await untyped(supabase)
        .from("geschillen")
        .update({
          ai_samenvatting: p.samenvatting,
          status: "verklaringen",
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.geschilId);

      const route = `/admin/geschillen`;
      await supabase
        .from("agent_actions")
        .update({
          executed_at: new Date().toISOString(),
          target_route: route,
          updated_at: new Date().toISOString(),
        })
        .eq("id", actionId);

      await logActivity(supabase, {
        companyId,
        userId,
        agentName,
        actionType: action.action_type,
        message: `Geschil-samenvatting goedgekeurd`,
        outputJson: { geschilId: p.geschilId },
      });

      revalidatePath("/admin/geschillen");
      revalidatePath("/dashboard/geschillen");
      return { ok: true, route };
    }

    if (action.action_type === "propose_materiaal_zoek") {
      await supabase
        .from("agent_actions")
        .update({
          executed_at: new Date().toISOString(),
          target_route: "/dashboard/bouwmaterialen",
          updated_at: new Date().toISOString(),
        })
        .eq("id", actionId);
      return { ok: true, route: "/dashboard/bouwmaterialen" };
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
