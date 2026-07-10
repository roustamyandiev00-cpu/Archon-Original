"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { proposeAgentAction } from "@/lib/agents/propose";
import { parseExtras } from "@/app/dashboard/instellingen/settings";
import { loadMergedAiConfig } from "@/lib/agents/companyAi";
import {
  actionTypeForStage,
  DEFAULT_INCASSO_SETTINGS,
  determineIncassoStage,
  stageLabel,
  type IncassoEmailSettings,
} from "@/components/dashboard/facturen/incasso";

export type ProactiveAlert = {
  id: string;
  agentName: string;
  title: string;
  message: string;
  href: string;
  options?: string[];
};

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

async function hasRecentLog(
  supabase: SupabaseClient,
  companyId: number,
  fingerprint: string,
  hours = 24,
) {
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();
  const { data } = await supabase
    .from("agent_activity_logs")
    .select("id")
    .eq("company_id", companyId)
    .gte("created_at", since)
    .ilike("message", `%${fingerprint}%`)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function hasPendingAction(
  supabase: SupabaseClient,
  companyId: number,
  fingerprint: string,
) {
  const { data } = await supabase
    .from("agent_actions")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .ilike("title", `%${fingerprint}%`)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function runProactiveAgentScan(): Promise<{
  alerts: ProactiveAlert[];
  proposed: number;
  error?: string;
}> {
  const access = await requireWriteAccess();
  if ("error" in access) return { alerts: [], proposed: 0, error: access.error };
  const { supabase, companyId, user } = access;

  const today = new Date().toISOString().slice(0, 10);
  const alerts: ProactiveAlert[] = [];
  let proposed = 0;

  const [followUpOffertes, overdueFacturen, acceptedOffertes, facturenForOffertes] =
    await Promise.all([
      supabase
        .from("offertes")
        .select("id, nummer, klant, sent_at")
        .eq("bedrijf_id", companyId)
        .in("status_new", ["verzonden", "bekeken"])
        .order("sent_at", { ascending: true })
        .limit(8),
      supabase
        .from("facturen")
        .select("id, nummer, klant, vervaldatum, totaal_bedrag")
        .eq("bedrijf_id", companyId)
        .is("paid_at", null)
        .neq("status", "betaald")
        .lt("vervaldatum", today)
        .order("vervaldatum", { ascending: true })
        .limit(5),
      supabase
        .from("offertes")
        .select("id, nummer, klant, accepted_at")
        .eq("bedrijf_id", companyId)
        .eq("status_new", "geaccepteerd")
        .order("accepted_at", { ascending: false })
        .limit(8),
      supabase
        .from("facturen")
        .select("offerte_id")
        .eq("bedrijf_id", companyId)
        .not("offerte_id", "is", null),
    ]);

  const invoicedOfferteIds = new Set(
    (facturenForOffertes.data ?? [])
      .map((f) => f.offerte_id)
      .filter((id): id is number => typeof id === "number"),
  );

  for (const offerte of followUpOffertes.data ?? []) {
    const days = daysSince(offerte.sent_at);
    if (days < 5) continue;

    const fingerprint = `offerte ${offerte.nummer}`;
    if (
      (await hasRecentLog(supabase, companyId, fingerprint)) ||
      (await hasPendingAction(supabase, companyId, fingerprint))
    ) {
      continue;
    }

    await supabase.from("agent_tasks").insert({
      company_id: companyId,
      assigned_agent: "Schatter",
      requested_by_agent: "Nova",
      title: `Offerte ${offerte.nummer} opvolgen`,
      description: `${offerte.klant} — ${days} dagen zonder reactie`,
      type: "follow_up_offerte",
      status: "pending",
      priority: days >= 10 ? "high" : "medium",
      target_entity_type: "offerte",
      target_entity_id: offerte.id,
      target_route: `/dashboard/offertes/${offerte.id}`,
      requires_approval: true,
      created_by_user_id: user.id,
    });

    await supabase.from("agent_activity_logs").insert({
      company_id: companyId,
      created_by_user_id: user.id,
      agent_name: "Schatter",
      action_type: "opvolging",
      message: `Proactief: offerte ${offerte.nummer} voor ${offerte.klant} verdient opvolging (${days} dagen).`,
    });

    alerts.push({
      id: `followup-${offerte.id}`,
      agentName: "Schatter",
      title: `Offerte ${offerte.nummer} opvolgen`,
      message: `${offerte.klant} heeft al ${days} dagen niet gereageerd. Zal ik een vriendelijke opvolging voorbereiden?`,
      href: `/dashboard/offertes/${offerte.id}`,
      options: ["Ja, bereid opvolging voor", "Later"],
    });
  }

  for (const factuur of overdueFacturen.data ?? []) {
    const fingerprint = `factuur ${factuur.nummer}`;
    if (
      (await hasRecentLog(supabase, companyId, fingerprint)) ||
      (await hasPendingAction(supabase, companyId, fingerprint))
    ) {
      continue;
    }

    const emailSettingsRes = await supabase
      .from("factuur_email_instellingen")
      .select(
        "herinnering_dagen_na, herinnering_herhaal_dagen, herinnering_max_aantal",
      )
      .eq("bedrijf_id", companyId)
      .maybeSingle();

    const { data: bedrijf } = await supabase
      .from("bedrijven")
      .select("ai_assistant")
      .eq("id", companyId)
      .maybeSingle();

    const extras = parseExtras(bedrijf?.ai_assistant ?? null) as {
      incasso?: { deurwaarderEmail?: string };
    };

    const incassoSettings: IncassoEmailSettings = {
      herinneringDagenNa:
        emailSettingsRes.data?.herinnering_dagen_na ??
        DEFAULT_INCASSO_SETTINGS.herinneringDagenNa,
      herinneringHerhaalDagen:
        emailSettingsRes.data?.herinnering_herhaal_dagen ??
        DEFAULT_INCASSO_SETTINGS.herinneringHerhaalDagen,
      herinneringMaxAantal:
        emailSettingsRes.data?.herinnering_max_aantal ??
        DEFAULT_INCASSO_SETTINGS.herinneringMaxAantal,
      deurwaarderEmail:
        extras.incasso?.deurwaarderEmail?.trim() ||
        process.env.INCASSO_DEURWAARDER_EMAIL?.trim() ||
        null,
    };

    const { data: fullFactuur } = await supabase
      .from("facturen")
      .select("reminder_count, vervaldatum")
      .eq("id", factuur.id)
      .maybeSingle();

    const stage = determineIncassoStage({
      vervaldatum: fullFactuur?.vervaldatum ?? factuur.vervaldatum,
      reminderCount: fullFactuur?.reminder_count ?? 0,
      settings: incassoSettings,
    });

    if (!stage) continue;

    const ai = await loadMergedAiConfig(supabase, companyId, user.id);
    const actionType = actionTypeForStage(stage);
    const title = `${stageLabel(stage)} — factuur ${factuur.nummer}`;
    const reason =
      stage === "deurwaarder"
        ? `${factuur.klant} — openstaand na herinneringen. Facturatie stelt het volledige dossier (factuur, bewijzen, ingebrekestellingen) samen voor de deurwaarder.`
        : `${factuur.klant} — factuur vervallen. Facturatie verstuurt ${stageLabel(stage).toLowerCase()} per e-mail met factuur-PDF als bewijs.`;

    const requiresApproval =
      stage === "deurwaarder" || ai.toestemming !== "versturen";

    const proposedAction = await proposeAgentAction({
      supabase,
      companyId,
      agentName: "Facturatie",
      actionType: actionType as "send_payment_reminder" | "send_formal_notice" | "forward_to_bailiff",
      title,
      reason,
      payload: { factuurId: factuur.id, stage },
      targetEntityType: "factuur",
      targetEntityId: factuur.id,
      targetRoute: `/dashboard/facturen/${factuur.id}`,
      requiresApproval,
      confidence: stage === "deurwaarder" ? 0.92 : 0.88,
    });

    if ("error" in proposedAction) continue;

    if (!requiresApproval) {
      const { executeAgentAction } = await import("@/lib/agents/executor");
      await supabase
        .from("agent_actions")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq("id", proposedAction.id);
      await executeAgentAction({
        supabase,
        companyId,
        userId: user.id,
        actionId: proposedAction.id,
      });
    } else {
      proposed += 1;
    }

    await supabase.from("agent_activity_logs").insert({
      company_id: companyId,
      created_by_user_id: user.id,
      agent_name: "Facturatie",
      action_type: actionType,
      message: `Proactief: ${stageLabel(stage)} klaargezet voor factuur ${factuur.nummer} (${factuur.klant}).`,
    });

    alerts.push({
      id: `incasso-${factuur.id}-${stage}`,
      agentName: "Facturatie",
      title,
      message: reason,
      href: requiresApproval
        ? "/dashboard/automatisaties"
        : `/dashboard/facturen/${factuur.id}`,
      options: requiresApproval
        ? ["Bekijk goedkeuringen", "Later"]
        : ["Bekijk factuur", "Later"],
    });
  }

  for (const offerte of acceptedOffertes.data ?? []) {
    if (invoicedOfferteIds.has(offerte.id)) continue;

    const fingerprint = `factuur van offerte ${offerte.nummer}`;
    if (
      (await hasRecentLog(supabase, companyId, fingerprint)) ||
      (await hasPendingAction(supabase, companyId, fingerprint))
    ) {
      continue;
    }

    const proposedAction = await proposeAgentAction({
      supabase,
      companyId,
      agentName: "Facturatie",
      actionType: "create_invoice_from_offerte",
      title: `Factuur aanmaken voor offerte ${offerte.nummer}`,
      reason: `${offerte.klant} heeft geaccepteerd — factuur nog niet aangemaakt.`,
      payload: { offerteId: offerte.id },
      targetEntityType: "offerte",
      targetEntityId: offerte.id,
      targetRoute: `/dashboard/facturen`,
      requiresApproval: true,
      confidence: 0.9,
    });

    if (!("error" in proposedAction)) {
      proposed += 1;
      await supabase.from("agent_activity_logs").insert({
        company_id: companyId,
        created_by_user_id: user.id,
        agent_name: "Facturatie",
        action_type: "factuur",
        message: `Proactief: factuur klaargezet voor geaccepteerde offerte ${offerte.nummer} (${offerte.klant}).`,
      });

      alerts.push({
        id: `invoice-${offerte.id}`,
        agentName: "Facturatie",
        title: `Factuur voor ${offerte.klant}`,
        message: `Offerte ${offerte.nummer} is geaccepteerd. Ik heb een factuurvoorstel klaargezet ter goedkeuring.`,
        href: "/dashboard/automatisaties",
        options: ["Bekijk goedkeuringen", "Later"],
      });
    }
  }

  if (alerts.length > 0 || proposed > 0) {
    revalidatePath("/dashboard/automatisaties");
  }

  return { alerts, proposed };
}
