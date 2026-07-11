import type { SupabaseClient } from "@supabase/supabase-js";
import { parseExtras } from "@/app/dashboard/instellingen/settings";
import {
  actionTypeForStage,
  buildCustomerEmail,
  daysOverdue,
  DEFAULT_INCASSO_SETTINGS,
  determineIncassoStage,
  stageLabel,
  type IncassoEmailSettings,
  type IncassoStage,
} from "@/components/dashboard/facturen/incasso";

export type InvoiceOverdueContext = {
  factuurId: number;
  nummer: string;
  klant: string;
  totaalBedrag: number;
  vervaldatum: string | null;
  daysOverdue: number;
  reminderCount: number;
  stage: IncassoStage | null;
  actionType: string | null;
  customerEmail: string | null;
  draftSubject: string | null;
  draftBody: string | null;
  betalingsherinneringenEnabled: boolean;
  hasPendingAction: boolean;
  hasAccountBlock: boolean;
  isPaid: boolean;
  timeline: Array<{ at: string; type: string; detail: string }>;
  contextBuiltAt: string;
};

async function loadIncassoSettings(
  supabase: SupabaseClient,
  tenantId: number,
): Promise<IncassoEmailSettings> {
  const [emailSettingsRes, bedrijfRes] = await Promise.all([
    supabase
      .from("factuur_email_instellingen")
      .select(
        "herinnering_actief, herinnering_dagen_na, herinnering_herhaal_dagen, herinnering_max_aantal",
      )
      .eq("bedrijf_id", tenantId)
      .maybeSingle(),
    supabase
      .from("bedrijven")
      .select("ai_assistant, naam, email")
      .eq("id", tenantId)
      .maybeSingle(),
  ]);

  const extras = parseExtras(bedrijfRes.data?.ai_assistant ?? null);

  return {
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
}

export async function buildInvoiceOverdueContext(
  supabase: SupabaseClient,
  tenantId: number,
  factuurId: number,
): Promise<InvoiceOverdueContext | null> {
  const { data: factuur } = await supabase
    .from("facturen")
    .select(
      "id, nummer, klant, totaal_bedrag, vervaldatum, reminder_count, paid_at, status, customer_id, structured_communication",
    )
    .eq("id", factuurId)
    .eq("bedrijf_id", tenantId)
    .maybeSingle();

  if (!factuur) return null;

  const { data: bedrijfRow } = await supabase
    .from("bedrijven")
    .select("ai_assistant, naam, email")
    .eq("id", tenantId)
    .maybeSingle();

  const companyExtras = parseExtras(bedrijfRow?.ai_assistant ?? null);
  const settings = await loadIncassoSettings(supabase, tenantId);

  let customerEmail: string | null = null;
  let hasAccountBlock = false;

  if (factuur.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("email, notes")
      .eq("id", factuur.customer_id)
      .eq("company_id", tenantId)
      .maybeSingle();
    customerEmail = customer?.email ?? null;
    const notes = (customer?.notes ?? "").toLowerCase();
    hasAccountBlock =
      notes.includes("[geblokkeerd]") || notes.includes("niet contacteren");
  }

  const stage = determineIncassoStage({
    vervaldatum: factuur.vervaldatum,
    reminderCount: factuur.reminder_count ?? 0,
    settings,
  });

  const actionType = stage ? actionTypeForStage(stage) : null;

  const { data: pendingActions } = await supabase
    .from("agent_actions")
    .select("id")
    .eq("company_id", tenantId)
    .eq("target_entity_type", "factuur")
    .eq("target_entity_id", factuurId)
    .eq("status", "pending")
    .limit(1);

  const overdueDays = daysOverdue(factuur.vervaldatum);

  let draftSubject: string | null = null;
  let draftBody: string | null = null;

  if (stage && customerEmail) {
    const email = buildCustomerEmail(stage, {
      id: factuur.id,
      nummer: factuur.nummer ?? `#${factuur.id}`,
      klant: factuur.klant ?? "klant",
      totaalBedrag: Number(factuur.totaal_bedrag ?? 0),
      vervaldatum: factuur.vervaldatum,
      reminderCount: factuur.reminder_count ?? 0,
      structuredCommunication: factuur.structured_communication,
      customerEmail,
      customerPhone: null,
      customerAddress: null,
      companyName: bedrijfRow?.naam ?? "Ons bedrijf",
      companyEmail: bedrijfRow?.email ?? null,
      companyIban: null,
      pdfUrl: `/dashboard/facturen/${factuur.id}/pdf`,
    });
    draftSubject = email.subject;
    draftBody = email.body;
  }

  const timeline: InvoiceOverdueContext["timeline"] = [];
  if (factuur.vervaldatum) {
    timeline.push({
      at: factuur.vervaldatum,
      type: "due",
      detail: `Vervaldatum factuur ${factuur.nummer}`,
    });
  }
  timeline.push({
    at: new Date().toISOString(),
    type: "overdue",
    detail: `${overdueDays} dagen over vervaldatum`,
  });

  const emailSettingsRes = await supabase
    .from("factuur_email_instellingen")
    .select("herinnering_actief")
    .eq("bedrijf_id", tenantId)
    .maybeSingle();

  const remindersActive =
    companyExtras.ai.betalingsherinneringen &&
    emailSettingsRes.data?.herinnering_actief !== false;

  return {
    factuurId: factuur.id,
    nummer: factuur.nummer ?? `#${factuur.id}`,
    klant: factuur.klant ?? "klant",
    totaalBedrag: Number(factuur.totaal_bedrag ?? 0),
    vervaldatum: factuur.vervaldatum,
    daysOverdue: overdueDays,
    reminderCount: factuur.reminder_count ?? 0,
    stage,
    actionType,
    customerEmail,
    draftSubject,
    draftBody,
    betalingsherinneringenEnabled: remindersActive,
    hasPendingAction: (pendingActions?.length ?? 0) > 0,
    hasAccountBlock,
    isPaid: Boolean(factuur.paid_at) || factuur.status === "betaald",
    timeline,
    contextBuiltAt: new Date().toISOString(),
  };
}

export function isInvoiceEligibleForReminder(
  ctx: InvoiceOverdueContext,
): { eligible: boolean; reason?: string } {
  if (ctx.isPaid) {
    return { eligible: false, reason: "Factuur is reeds betaald" };
  }
  if (!ctx.betalingsherinneringenEnabled) {
    return { eligible: false, reason: "Betalingsherinneringen uitgeschakeld" };
  }
  if (ctx.hasAccountBlock) {
    return { eligible: false, reason: "Account heeft contactblokkade" };
  }
  if (ctx.hasPendingAction) {
    return { eligible: false, reason: "Actief incassovoorstel bestaat al" };
  }
  if (!ctx.stage || !ctx.actionType) {
    return { eligible: false, reason: "Nog geen incassostap vereist" };
  }
  return { eligible: true };
}

export function incassoTitle(ctx: InvoiceOverdueContext): string {
  if (!ctx.stage) return `Factuur ${ctx.nummer}`;
  return `${stageLabel(ctx.stage)} — factuur ${ctx.nummer}`;
}

export function incassoReason(ctx: InvoiceOverdueContext): string {
  if (!ctx.stage) return `${ctx.klant} — factuur openstaand`;
  if (ctx.stage === "deurwaarder") {
    return `${ctx.klant} — openstaand na herinneringen. Lima stelt het volledige dossier samen voor de deurwaarder.`;
  }
  return `${ctx.klant} — factuur ${ctx.daysOverdue} dagen over vervaldatum. Lima stelt ${stageLabel(ctx.stage).toLowerCase()} voor.`;
}
