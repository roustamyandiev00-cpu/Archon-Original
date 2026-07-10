"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseExtras } from "@/app/dashboard/instellingen/settings";
import {
  buildBailiffEmail,
  buildCustomerEmail,
  DEFAULT_INCASSO_SETTINGS,
  type IncassoEmailSettings,
  type IncassoFactuurContext,
  type IncassoStage,
  mailtoUrl,
  stageLabel,
} from "@/components/dashboard/facturen/incasso";
import { requireWriteAccess } from "@/components/dashboard/context";

export type ExecuteIncassoInput = {
  factuurId: number;
  stage: IncassoStage;
  agentName?: string;
};

async function loadIncassoSettings(
  supabase: SupabaseClient,
  companyId: number,
): Promise<IncassoEmailSettings> {
  const [emailSettingsRes, bedrijfRes] = await Promise.all([
    supabase
      .from("factuur_email_instellingen")
      .select(
        "herinnering_dagen_na, herinnering_herhaal_dagen, herinnering_max_aantal",
      )
      .eq("bedrijf_id", companyId)
      .maybeSingle(),
    supabase
      .from("bedrijven")
      .select("ai_assistant")
      .eq("id", companyId)
      .maybeSingle(),
  ]);

  const extras = parseExtras(bedrijfRes.data?.ai_assistant ?? null) as {
    incasso?: { deurwaarderEmail?: string };
  };

  const emailSettings = emailSettingsRes.data;
  return {
    herinneringDagenNa:
      emailSettings?.herinnering_dagen_na ??
      DEFAULT_INCASSO_SETTINGS.herinneringDagenNa,
    herinneringHerhaalDagen:
      emailSettings?.herinnering_herhaal_dagen ??
      DEFAULT_INCASSO_SETTINGS.herinneringHerhaalDagen,
    herinneringMaxAantal:
      emailSettings?.herinnering_max_aantal ??
      DEFAULT_INCASSO_SETTINGS.herinneringMaxAantal,
    deurwaarderEmail:
      extras.incasso?.deurwaarderEmail?.trim() ||
      process.env.INCASSO_DEURWAARDER_EMAIL?.trim() ||
      null,
  };
}

async function loadFactuurContext(
  supabase: SupabaseClient,
  companyId: number,
  factuurId: number,
  siteOrigin: string,
): Promise<IncassoFactuurContext | { error: string }> {
  const { data: factuur } = await supabase
    .from("facturen")
    .select(
      "id, nummer, klant, totaal_bedrag, vervaldatum, reminder_count, structured_communication, customer_id",
    )
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!factuur) return { error: "Factuur niet gevonden." };

  const [bedrijfRes, customerRes] = await Promise.all([
    supabase
      .from("bedrijven")
      .select("naam, email, iban")
      .eq("id", companyId)
      .maybeSingle(),
    factuur.customer_id
      ? supabase
          .from("customers")
          .select("email, phone, address, postcode, city")
          .eq("id", factuur.customer_id)
          .eq("company_id", companyId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const customer = customerRes.data;
  const address = customer
    ? [customer.address, customer.postcode, customer.city]
        .filter(Boolean)
        .join(", ")
    : null;

  return {
    id: factuur.id,
    nummer: factuur.nummer ?? `#${factuur.id}`,
    klant: factuur.klant ?? "Klant",
    totaalBedrag: Number(factuur.totaal_bedrag ?? 0),
    vervaldatum: factuur.vervaldatum,
    reminderCount: factuur.reminder_count ?? 0,
    structuredCommunication: factuur.structured_communication,
    customerEmail: customer?.email ?? null,
    customerPhone: customer?.phone ?? null,
    customerAddress: address,
    companyName: bedrijfRes.data?.naam ?? "Uw leverancier",
    companyEmail: bedrijfRes.data?.email ?? null,
    companyIban: bedrijfRes.data?.iban ?? null,
    pdfUrl: `${siteOrigin}/dashboard/facturen/${factuur.id}/pdf`,
  };
}

async function reminderHistory(
  supabase: SupabaseClient,
  companyId: number,
  factuurId: number,
): Promise<string[]> {
  const { data } = await supabase
    .from("reminders")
    .select("title, sent_at, message")
    .eq("company_id", companyId)
    .eq("entity_type", "factuur")
    .eq("entity_id", factuurId)
    .order("sent_at", { ascending: true });

  return (data ?? []).map((row) => {
    const when = row.sent_at
      ? new Date(row.sent_at).toLocaleDateString("nl-BE")
      : "onbekend";
    return `${row.title} (${when})`;
  });
}

export async function executeIncassoStep(
  input: ExecuteIncassoInput & {
    supabase: SupabaseClient;
    companyId: number;
    userId: string;
    siteOrigin?: string;
  },
) {
  const {
    supabase,
    companyId,
    userId,
    factuurId,
    stage,
    agentName = "Facturatie",
    siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  } = input;

  const settings = await loadIncassoSettings(supabase, companyId);
  const ctxResult = await loadFactuurContext(
    supabase,
    companyId,
    factuurId,
    siteOrigin,
  );
  if ("error" in ctxResult) return { error: ctxResult.error };
  const ctx = ctxResult;

  const now = new Date().toISOString();
  const history = await reminderHistory(supabase, companyId, factuurId);

  if (stage === "deurwaarder") {
    const bailiffEmail = settings.deurwaarderEmail;
    if (!bailiffEmail) {
      return {
        error:
          "Geen deurwaarder-e-mailadres ingesteld. Zet INCASSO_DEURWAARDER_EMAIL in .env of incasso.deurwaarderEmail in bedrijfsinstellingen.",
      };
    }

    const bailiffMail = buildBailiffEmail(ctx, history);

    await supabase.from("reminders").insert({
      company_id: companyId,
      user_id: userId,
      entity_type: "factuur",
      entity_id: factuurId,
      title: `Deurwaarder — ${ctx.nummer}`,
      message: bailiffMail.body,
      reminder_at: now,
      sent_at: now,
      is_sent: true,
      email_enabled: true,
      in_app_enabled: true,
    });

    await supabase
      .from("facturen")
      .update({
        reminder_count: (ctx.reminderCount ?? 0) + 1,
        last_reminder_sent_at: now,
        status: "incasso",
        updated_at: now,
      })
      .eq("id", factuurId)
      .eq("bedrijf_id", companyId);

    await supabase.from("agent_activity_logs").insert({
      company_id: companyId,
      created_by_user_id: userId,
      agent_name: agentName,
      action_type: "forward_to_bailiff",
      message: `Incassodossier doorgestuurd naar deurwaarder voor factuur ${ctx.nummer} (${ctx.klant}).`,
      output_json: {
        factuurId,
        bailiffEmail,
        bailiffMailto: mailtoUrl(
          bailiffEmail,
          bailiffMail.subject,
          bailiffMail.body,
        ),
        pdfUrl: ctx.pdfUrl,
        dossier: bailiffMail.body,
      },
    });

    revalidatePath("/dashboard/facturen");
    revalidatePath(`/dashboard/facturen/${factuurId}`);
    revalidatePath("/dashboard/automatisaties");
    revalidatePath("/dashboard/cron");

    return {
      ok: true as const,
      route: `/dashboard/facturen/${factuurId}`,
      bailiffMailto: mailtoUrl(
        bailiffEmail,
        bailiffMail.subject,
        bailiffMail.body,
      ),
    };
  }

  if (!ctx.customerEmail) {
    return {
      error: `Geen e-mailadres bekend voor ${ctx.klant}. Vul het e-mailadres in bij Contacten.`,
    };
  }

  const mail = buildCustomerEmail(stage, ctx);

  await supabase.from("reminders").insert({
    company_id: companyId,
    user_id: userId,
    entity_type: "factuur",
    entity_id: factuurId,
    title: `${stageLabel(stage)} — ${ctx.nummer}`,
    message: mail.body,
    reminder_at: now,
    sent_at: now,
    is_sent: true,
    email_enabled: true,
    in_app_enabled: true,
  });

  await supabase
    .from("facturen")
    .update({
      reminder_count: (ctx.reminderCount ?? 0) + 1,
      last_reminder_sent_at: now,
      status: stage === "ingebrekestelling" ? "aanmaning" : "herinnering",
      updated_at: now,
    })
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId);

  await supabase.from("agent_activity_logs").insert({
    company_id: companyId,
    created_by_user_id: userId,
    agent_name: agentName,
    action_type:
      stage === "ingebrekestelling"
        ? "send_formal_notice"
        : "send_payment_reminder",
    message: `${stageLabel(stage)} verstuurd voor factuur ${ctx.nummer} naar ${ctx.customerEmail}.`,
    output_json: {
      factuurId,
      stage,
      recipientEmail: ctx.customerEmail,
      subject: mail.subject,
      mailto: mailtoUrl(ctx.customerEmail, mail.subject, mail.body),
      pdfUrl: ctx.pdfUrl,
    },
  });

  revalidatePath("/dashboard/facturen");
  revalidatePath(`/dashboard/facturen/${factuurId}`);
  revalidatePath("/dashboard/automatisaties");
  revalidatePath("/dashboard/cron");

  return {
    ok: true as const,
    route: `/dashboard/facturen/${factuurId}`,
    mailto: mailtoUrl(ctx.customerEmail, mail.subject, mail.body),
  };
}

export async function runIncassoForFactuur(input: ExecuteIncassoInput) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  return executeIncassoStep({
    ...input,
    supabase,
    companyId,
    userId: user.id,
  });
}
