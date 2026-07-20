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
import {
  loadEmailDeliveryPreference,
  sendEmailViaCompanySmtp,
} from "@/app/dashboard/instellingen/smtp-actions";
import { generateFactuurPdfBuffer } from "@/components/dashboard/email/factuurPdfBuffer";

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

  let customer = customerRes.data;
  if (!customer?.email && factuur.klant) {
    const klantName = factuur.klant.trim();
    const { data: byName } = await supabase
      .from("customers")
      .select("email, phone, address, postcode, city")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .ilike("name", klantName)
      .limit(1)
      .maybeSingle();

    if (byName) {
      customer = byName;
    } else {
      const { data: byCompanyName } = await supabase
        .from("customers")
        .select("email, phone, address, postcode, city")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .ilike("company_name", klantName)
        .limit(1)
        .maybeSingle();
      customer = byCompanyName ?? customer;
    }
  }
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

async function deliverIncassoEmail(
  supabase: SupabaseClient,
  companyId: number,
  factuurId: number,
  to: string,
  subject: string,
  body: string,
): Promise<
  | { mode: "smtp"; messageId: string }
  | { mode: "mailto"; mailto: string }
  | { error: string }
> {
  const deliveryMode = await loadEmailDeliveryPreference(supabase, companyId);
  if (deliveryMode !== "smtp") {
    return { mode: "mailto", mailto: mailtoUrl(to, subject, body) };
  }

  const pdfResult = await generateFactuurPdfBuffer(
    supabase,
    companyId,
    factuurId,
  );
  const attachments =
    "buffer" in pdfResult
      ? [{ filename: pdfResult.fileName, content: pdfResult.buffer }]
      : undefined;

  const sent = await sendEmailViaCompanySmtp(supabase, companyId, {
    to,
    subject,
    text: body,
    attachments,
  });

  if ("ok" in sent && sent.ok === true) {
    return { mode: "smtp", messageId: sent.messageId };
  }

  if ("smtpMissing" in sent && sent.smtpMissing) {
    return { mode: "mailto", mailto: mailtoUrl(to, subject, body) };
  }

  return {
    error: "error" in sent ? sent.error : "E-mail verzenden mislukt.",
  };
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
          "Geen deurwaarder-e-mailadres ingesteld. Vul dit in bij Instellingen → AI-agent, of zet INCASSO_DEURWAARDER_EMAIL in .env.",
      };
    }

    const bailiffMail = buildBailiffEmail(ctx, history);
    const delivery = await deliverIncassoEmail(
      supabase,
      companyId,
      factuurId,
      bailiffEmail,
      bailiffMail.subject,
      bailiffMail.body,
    );
    if ("error" in delivery) return { error: delivery.error };

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
      message: `Incassodossier doorgestuurd naar deurwaarder voor factuur ${ctx.nummer} (${ctx.klant})${
        delivery.mode === "smtp" ? " via SMTP" : ""
      }.`,
      output_json: {
        factuurId,
        bailiffEmail,
        emailSent: delivery.mode === "smtp",
        messageId: delivery.mode === "smtp" ? delivery.messageId : undefined,
        bailiffMailto:
          delivery.mode === "mailto" ? delivery.mailto : undefined,
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
      emailSent: delivery.mode === "smtp",
      bailiffMailto:
        delivery.mode === "mailto" ? delivery.mailto : undefined,
    };
  }

  if (!ctx.customerEmail) {
    return {
      error: `Geen e-mailadres bekend voor ${ctx.klant}. Vul het e-mailadres in bij Contacten.`,
    };
  }

  const mail = buildCustomerEmail(stage, ctx);
  const delivery = await deliverIncassoEmail(
    supabase,
    companyId,
    factuurId,
    ctx.customerEmail,
    mail.subject,
    mail.body,
  );
  if ("error" in delivery) return { error: delivery.error };

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
    message: `${stageLabel(stage)} verstuurd voor factuur ${ctx.nummer} naar ${ctx.customerEmail}${
      delivery.mode === "smtp" ? " via SMTP" : ""
    }.`,
    output_json: {
      factuurId,
      stage,
      recipientEmail: ctx.customerEmail,
      subject: mail.subject,
      emailSent: delivery.mode === "smtp",
      messageId: delivery.mode === "smtp" ? delivery.messageId : undefined,
      mailto: delivery.mode === "mailto" ? delivery.mailto : undefined,
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
    emailSent: delivery.mode === "smtp",
    mailto: delivery.mode === "mailto" ? delivery.mailto : undefined,
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
