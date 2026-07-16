"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { proposeAgentAction } from "@/lib/agents/propose";
import { runAllSchedulersForTenant } from "@/lib/agents/scheduler";
import { dispatchPendingEvents } from "@/lib/agents/dispatcher";
import { parseExtras } from "@/app/dashboard/instellingen/settings";

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

const DEAL_TERMINAL_STAGES = new Set(["Gewonnen", "Verloren"]);
const NIEUWE_LEAD_DAGEN = 2;
const OPVOLGING_HERHAAL_DAGEN = 7;

type StaleDealRow = {
  id: number;
  titel: string;
  stadium: string;
  contactpersoon: string | null;
  laatste_contact_op: string | null;
  deadline: string | null;
  created_at: string;
  customers: { name: string; company_name: string | null } | null;
};

function dealFollowUpReason(
  deal: StaleDealRow,
): { reason: string; urgent: boolean } | null {
  if (deal.deadline) {
    const overdueDays = daysSince(deal.deadline);
    if (overdueDays > 0) {
      return {
        reason: `Geplande opvolging stond gepland op ${deal.deadline} — dat is ${overdueDays} dag${overdueDays === 1 ? "" : "en"} geleden.`,
        urgent: true,
      };
    }
  }

  if (!deal.laatste_contact_op) {
    const days = daysSince(deal.created_at);
    if (days >= NIEUWE_LEAD_DAGEN) {
      return {
        reason: `Nog geen contact geweest sinds binnenkomst, ${days} dagen geleden.`,
        urgent: days >= 5,
      };
    }
    return null;
  }

  const daysSinceContact = daysSince(deal.laatste_contact_op);
  if (daysSinceContact >= OPVOLGING_HERHAAL_DAGEN) {
    return {
      reason: `Laatste contact was ${daysSinceContact} dagen geleden.`,
      urgent: daysSinceContact >= 14,
    };
  }

  return null;
}

function dealDisplayName(deal: StaleDealRow): string {
  if (deal.contactpersoon?.trim()) return deal.contactpersoon.trim();
  if (deal.customers?.company_name) return deal.customers.company_name;
  if (deal.customers?.name) return deal.customers.name;
  return deal.titel;
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

  const { data: bedrijfRow } = await supabase
    .from("bedrijven")
    .select("ai_assistant")
    .eq("id", companyId)
    .maybeSingle();
  const companyExtras = parseExtras(bedrijfRow?.ai_assistant ?? null);
  const betalingsherinneringenEnabled = companyExtras.ai.betalingsherinneringen;

  const [followUpOffertes, overdueFacturen, acceptedOffertes, facturenForOffertes, staleDeals, schedulerResult] =
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
      supabase
        .from("deals")
        .select(
          "id, titel, stadium, contactpersoon, laatste_contact_op, deadline, created_at, customers(name, company_name)",
        )
        .eq("bedrijf_id", companyId)
        .not("stadium", "in", '("Gewonnen","Verloren")')
        .order("created_at", { ascending: true })
        .limit(15),
      runAllSchedulersForTenant(supabase, companyId, {
        autoExecuteUserId: user.id,
      }),
    ]);

  await dispatchPendingEvents(supabase, companyId, {
    autoExecuteUserId: user.id,
  });

  proposed +=
    (schedulerResult.quoteFollowup.emitted ?? 0) +
    (schedulerResult.invoiceOverdue.emitted ?? 0);

  for (const offerte of followUpOffertes.data ?? []) {
    const days = daysSince(offerte.sent_at);
    if (days < 5) continue;

    alerts.push({
      id: `followup-${offerte.id}`,
      agentName: "Nova",
      title: `Offerte ${offerte.nummer} opvolgen`,
      message: `${offerte.klant} heeft al ${days} dagen niet gereageerd. Nova heeft een voorstel klaarstaan in je inbox.`,
      href: `/dashboard/offertes/${offerte.id}`,
      options: ["Bekijk voorstel", "Later"],
    });
  }

  const invoicedOfferteIds = new Set(
    (facturenForOffertes.data ?? [])
      .map((f) => f.offerte_id)
      .filter((id): id is number => typeof id === "number"),
  );

  for (const rawDeal of staleDeals.data ?? []) {
    const deal = rawDeal as unknown as StaleDealRow;
    if (DEAL_TERMINAL_STAGES.has(deal.stadium)) continue;

    const status = dealFollowUpReason(deal);
    if (!status) continue;

    const klant = dealDisplayName(deal);
    const fingerprint = `deal ${deal.id}`;
    if (
      (await hasRecentLog(supabase, companyId, fingerprint, 72)) ||
      (await hasPendingAction(supabase, companyId, fingerprint))
    ) {
      continue;
    }

    await supabase.from("agent_tasks").insert({
      company_id: companyId,
      assigned_agent: "Daan",
      requested_by_agent: "Lara",
      title: `Lead opvolgen: ${klant} (deal ${deal.id})`,
      description: status.reason,
      type: "follow_up_lead",
      status: "pending",
      priority: status.urgent ? "high" : "medium",
      target_entity_type: "deal",
      target_entity_id: deal.id,
      target_route: "/dashboard/leads",
      requires_approval: true,
      created_by_user_id: user.id,
    });

    await supabase.from("agent_activity_logs").insert({
      company_id: companyId,
      created_by_user_id: user.id,
      agent_name: "Daan",
      action_type: "proactive_lead_followup",
      message: `Proactief: ${klant} (deal ${deal.id}) verdient opvolging — ${status.reason}`,
    });

    alerts.push({
      id: `lead-followup-${deal.id}`,
      agentName: "Daan",
      title: `${klant} opvolgen`,
      message: `${status.reason} Bekijk de pipeline om in te plannen.`,
      href: "/dashboard/leads",
      options: ["Bekijk pipeline", "Later"],
    });
  }

  for (const factuur of overdueFacturen.data ?? []) {
    if (!betalingsherinneringenEnabled) continue;

    const days = daysSince(factuur.vervaldatum);
    alerts.push({
      id: `incasso-alert-${factuur.id}`,
      agentName: "Lara",
      title: `Factuur ${factuur.nummer} vervallen`,
      message: `${factuur.klant} — ${days > 0 ? `${days} dagen over vervaldatum` : "vandaag vervallen"}. Lara bewaakt incasso in je inbox.`,
      href: "/dashboard/automatisaties",
      options: ["Bekijk voorstel", "Later"],
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
      agentName: "Nina",
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
        agent_name: "Nina",
        action_type: "proactive_invoice_from_offerte",
        message: `Proactief: factuur klaargezet voor geaccepteerde offerte ${offerte.nummer} (${offerte.klant}).`,
      });

      alerts.push({
        id: `invoice-${offerte.id}`,
        agentName: "Nina",
        title: `Factuur voor ${offerte.klant}`,
        message: `Offerte ${offerte.nummer} is geaccepteerd. Ik heb een factuurvoorstel klaargezet ter goedkeuring.`,
        href: "/dashboard/automatisaties",
        options: ["Bekijk goedkeuringen", "Later"],
      });
    }
  }

  if (alerts.length > 0 || proposed > 0) {
    revalidatePath("/dashboard/automatisaties");
    revalidatePath("/dashboard/leads");
  }

  return { alerts, proposed };
}
