import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_QUOTE_FOLLOWUP_DAYS = 5;

export type QuoteFollowupContext = {
  offerteId: number;
  nummer: string;
  klant: string;
  status: string;
  sentAt: string | null;
  daysSinceSent: number;
  bedrag: number | null;
  customerEmail: string | null;
  customerPhone: string | null;
  hasRecentManualContact: boolean;
  hasAccountBlock: boolean;
  hasActiveFollowup: boolean;
  timeline: Array<{ at: string; type: string; detail: string }>;
  contextBuiltAt: string;
  isStale: boolean;
};

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export async function buildQuoteFollowupContext(
  supabase: SupabaseClient,
  tenantId: number,
  offerteId: number,
): Promise<QuoteFollowupContext | null> {
  const { data: offerte } = await supabase
    .from("offertes")
    .select(
      "id, nummer, klant, status_new, sent_at, bedrag, customer_id, updated_at",
    )
    .eq("id", offerteId)
    .eq("bedrijf_id", tenantId)
    .maybeSingle();

  if (!offerte) return null;

  let customerEmail: string | null = null;
  let customerPhone: string | null = null;
  let hasAccountBlock = false;

  if (offerte.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("email, phone, notes")
      .eq("id", offerte.customer_id)
      .eq("company_id", tenantId)
      .maybeSingle();

    customerEmail = customer?.email ?? null;
    customerPhone = customer?.phone ?? null;
    const notes = (customer?.notes ?? "").toLowerCase();
    hasAccountBlock =
      notes.includes("[geblokkeerd]") || notes.includes("niet contacteren");
  }

  const since = new Date(Date.now() - 3 * 86_400_000).toISOString();
  const [emailLogs, pendingActions] = await Promise.all([
    supabase
      .from("offerte_email_log")
      .select("created_at, status")
      .eq("offerte_id", offerteId)
      .eq("bedrijf_id", tenantId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("agent_actions")
      .select("id, status, action_type")
      .eq("company_id", tenantId)
      .eq("target_entity_type", "offerte")
      .eq("target_entity_id", offerteId)
      .in("status", ["pending", "approved"])
      .eq("action_type", "send_quote_followup")
      .limit(1),
  ]);

  const hasRecentManualContact = (emailLogs.data ?? []).some(
    (log) => log.status !== "agent_marked" && log.status !== "followup_prepared",
  );

  const timeline: QuoteFollowupContext["timeline"] = [];
  if (offerte.sent_at) {
    timeline.push({
      at: offerte.sent_at,
      type: "sent",
      detail: `Offerte ${offerte.nummer} verzonden`,
    });
  }
  for (const log of emailLogs.data ?? []) {
    timeline.push({
      at: log.created_at,
      type: "email",
      detail: `E-mailactiviteit (${log.status})`,
    });
  }

  return {
    offerteId: offerte.id,
    nummer: offerte.nummer ?? `#${offerte.id}`,
    klant: offerte.klant ?? "klant",
    status: offerte.status_new ?? "onbekend",
    sentAt: offerte.sent_at,
    daysSinceSent: daysSince(offerte.sent_at),
    bedrag: offerte.bedrag,
    customerEmail,
    customerPhone,
    hasRecentManualContact,
    hasAccountBlock,
    hasActiveFollowup: (pendingActions.data?.length ?? 0) > 0,
    timeline,
    contextBuiltAt: new Date().toISOString(),
    isStale: false,
  };
}

export function formatEuro(amount: number | null): string {
  if (amount == null) return "";
  return ` ter waarde van € ${Math.round(amount).toLocaleString("nl-BE")}`;
}

export function buildFollowupDraftMessage(ctx: QuoteFollowupContext): string {
  const bedragTekst = formatEuro(ctx.bedrag);
  return `Beste ${ctx.klant},

Ik wil even polsen naar onze offerte ${ctx.nummer}${bedragTekst}. Heeft u nog vragen of kunnen we een vervolgstap plannen?

Met vriendelijke groet`;
}

export function isQuoteEligibleForFollowup(
  ctx: QuoteFollowupContext,
  followupDays = DEFAULT_QUOTE_FOLLOWUP_DAYS,
): { eligible: boolean; reason?: string } {
  if (!["verzonden", "bekeken"].includes(ctx.status)) {
    return { eligible: false, reason: "Offerte is niet meer actief" };
  }
  if (ctx.hasAccountBlock) {
    return { eligible: false, reason: "Account heeft contactblokkade" };
  }
  if (ctx.hasRecentManualContact) {
    return { eligible: false, reason: "Recent handmatig contact" };
  }
  if (ctx.hasActiveFollowup) {
    return { eligible: false, reason: "Actieve follow-up bestaat al" };
  }
  if (ctx.daysSinceSent < followupDays) {
    return {
      eligible: false,
      reason: `Follow-uptermijn (${followupDays} dagen) nog niet verstreken`,
    };
  }
  return { eligible: true };
}
