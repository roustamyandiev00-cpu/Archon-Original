"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { statusMeta, formatEuro } from "@/lib/offertes";
import { emitDomainEvent } from "@/lib/agents/events/emit";
import { SITE_URL } from "@/lib/seo";
import {
  loadEmailDeliveryPreference,
  sendEmailViaCompanySmtp,
} from "@/app/dashboard/instellingen/smtp-actions";
import { getPublicOffertePdf } from "@/lib/offertes/publicOfferte";
import { loadCompanySmtpSettings } from "@/components/dashboard/email/smtp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toWhatsappNumber(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return "32" + digits.slice(1);
  return digits;
}

function randomToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    SITE_URL
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function markOfferteSent(
  offerteId: number,
  opts?: { recipientEmail?: string | null; channel?: string },
) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const { data: offerte } = await supabase
    .from("offertes")
    .select(
      "id, nummer, klant, bedrag, status_new, public_token, customer_id",
    )
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!offerte) return { error: "Offerte niet gevonden." };

  let customerEmail: string | null = opts?.recipientEmail ?? null;

  if (offerte.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("email")
      .eq("id", offerte.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    customerEmail = customerEmail || customer?.email || null;
  }

  const token = offerte.public_token || randomToken();
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("offertes")
    .update({
      status_new: "verzonden",
      status: statusMeta("verzonden").label,
      sent_at: now,
      public_token: token,
      token_expires_at: new Date(
        Date.now() + 90 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updated_at: now,
    })
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId);

  if (updateError) return { error: updateError.message };

  const recipient = customerEmail || "onbekend@klant.be";
  await supabase.from("offerte_email_log").insert({
    bedrijf_id: companyId,
    offerte_id: offerteId,
    recipient_email: recipient,
    sent_by: user.id,
    status:
      opts?.channel === "agent"
        ? "agent_marked"
        : opts?.channel === "smtp"
          ? "smtp_sent"
          : "shared",
  });

  await supabase.rpc("log_offerte_activity", {
    p_offerte_id: offerteId,
    p_company_id: companyId,
    p_activity_type: "sent",
    p_old_status: offerte.status_new ?? undefined,
    p_new_status: "verzonden",
    p_performed_by: user.id,
    p_metadata: { channel: opts?.channel ?? "manual" },
  });

  await emitDomainEvent({
    supabase,
    eventType: "quote.sent",
    tenantId: companyId,
    entityType: "offerte",
    entityId: offerteId,
    actorType: "user",
    actorId: user.id,
    payload: {
      nummer: offerte.nummer,
      klant: offerte.klant,
      channel: opts?.channel ?? "manual",
    },
    idempotencyKey: `quote.sent:${companyId}:${offerteId}:${now}`,
  });

  revalidatePath("/dashboard/offertes");
  revalidatePath(`/dashboard/offertes/${offerteId}`);
  return { ok: true as const, token };
}

export async function sendOfferteByEmail(
  offerteId: number,
  recipientEmail?: string,
) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const deliveryMode = await loadEmailDeliveryPreference(supabase, companyId);
  if (deliveryMode !== "smtp") {
    return {
      error:
        "Automatische e-mail staat uit. Kies in Instellingen → Integraties voor «Automatisch via SMTP / Gmail», of gebruik «E-mail openen».",
      smtpMissing: false,
      deliveryMode,
    };
  }

  const { data: offerte } = await supabase
    .from("offertes")
    .select("id, nummer, klant, bedrag, customer_id, public_token")
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!offerte) return { error: "Offerte niet gevonden." };

  let email = recipientEmail?.trim().toLowerCase() || null;
  if (!email && offerte.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("email")
      .eq("id", offerte.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    email = customer?.email?.trim().toLowerCase() || null;
  }

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Vul eerst een geldig e-mailadres van de klant in." };
  }

  const token = offerte.public_token || randomToken();
  const { error: tokenError } = await supabase
    .from("offertes")
    .update({
      public_token: token,
      token_expires_at: new Date(
        Date.now() + 90 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId);

  if (tokenError) return { error: tokenError.message };

  const nummer = offerte.nummer ?? `#${offerte.id}`;
  const klant = offerte.klant ?? "klant";
  const bedragTekst =
    offerte.bedrag != null
      ? ` ter waarde van ${formatEuro(offerte.bedrag)}`
      : "";
  const shareUrl = `${appOrigin()}/o/${token}`;
  const body = `Beste ${klant},

Hierbij ontvangt u offerte ${nummer}${bedragTekst}.

Bekijk de offerte via deze beveiligde link:
${shareUrl}

Heeft u nog vragen, laat het gerust weten.

Met vriendelijke groet`;

  const html = `<p>Beste ${escapeHtml(klant)},</p>
<p>Hierbij ontvangt u offerte <strong>${escapeHtml(nummer)}</strong>${escapeHtml(bedragTekst)}.</p>
<p><a href="${shareUrl}">Bekijk de offerte</a> (of open de bijgevoegde PDF).</p>
<p>Heeft u nog vragen, laat het gerust weten.</p>
<p>Met vriendelijke groet</p>`;

  let attachments:
    | { filename: string; content: Buffer; contentType?: string }[]
    | undefined;
  const pdf = await getPublicOffertePdf(token);
  if (pdf.ok) {
    attachments = [
      {
        filename: `Offerte-${pdf.nummer || nummer}.pdf`,
        content: pdf.pdf,
        contentType: "application/pdf",
      },
    ];
  }

  const delivered = await sendEmailViaCompanySmtp(supabase, companyId, {
    to: email,
    subject: `Offerte ${nummer}`,
    text: body,
    html,
    attachments,
  });

  if (!("ok" in delivered) || !delivered.ok) {
    const message =
      "error" in delivered ? delivered.error : "E-mail verzenden mislukt.";
    await supabase.from("offerte_email_log").insert({
      bedrijf_id: companyId,
      offerte_id: offerteId,
      recipient_email: email,
      sent_by: user.id,
      status: "smtp_failed",
      error_message: message,
    });
    return {
      error: message,
      smtpMissing: "smtpMissing" in delivered && Boolean(delivered.smtpMissing),
    };
  }

  const marked = await markOfferteSent(offerteId, {
    recipientEmail: email,
    channel: "smtp",
  });
  if ("error" in marked) return { error: marked.error };

  return { ok: true as const, recipientEmail: email };
}

export async function prepareOfferteShare(offerteId: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { data: offerte } = await supabase
    .from("offertes")
    .select("id, nummer, klant, bedrag, customer_id, public_token")
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!offerte) return { error: "Offerte niet gevonden." };

  let email: string | null = null;
  let phone: string | null = null;
  if (offerte.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("email, phone")
      .eq("id", offerte.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    email = customer?.email ?? null;
    phone = customer?.phone ?? null;
  }

  const token = offerte.public_token || randomToken();
  const { error: tokenError } = await supabase
    .from("offertes")
    .update({
      public_token: token,
      token_expires_at: new Date(
        Date.now() + 90 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId);

  if (tokenError) return { error: tokenError.message };

  const nummer = offerte.nummer ?? `#${offerte.id}`;
  const klant = offerte.klant ?? "klant";
  const bedragTekst =
    offerte.bedrag != null
      ? ` ter waarde van ${formatEuro(offerte.bedrag)}`
      : "";
  const sharePath = `/o/${token}`;
  const shareUrl = `${appOrigin()}${sharePath}`;
  const bericht = `Beste ${klant},\n\nHierbij offerte ${nummer}${bedragTekst}.\n\nBekijk de offerte via deze link:\n${shareUrl}\n\nHeeft u nog vragen, laat het gerust weten.\n\nMet vriendelijke groet`;

  const mailtoUrl = email
    ? `mailto:${email}?subject=${encodeURIComponent(`Offerte ${nummer}`)}&body=${encodeURIComponent(bericht)}`
    : null;
  const whatsappUrl = phone
    ? `https://wa.me/${toWhatsappNumber(phone)}?text=${encodeURIComponent(bericht)}`
    : null;

  const deliveryMode = await loadEmailDeliveryPreference(supabase, companyId);
  const smtpConfigured = Boolean(
    await loadCompanySmtpSettings(supabase, companyId),
  );

  return {
    ok: true as const,
    shareUrl,
    sharePath,
    pdfUrl: `${sharePath}/pdf`,
    mailtoUrl,
    whatsappUrl,
    nummer,
    klant,
    customerEmail: email,
    deliveryMode,
    smtpConfigured,
    canSendViaSmtp: deliveryMode === "smtp" && smtpConfigured,
  };
}

/** Bereidt de link voor en registreert daarna een bewuste manuele deelactie. */
export async function sendOfferteShare(offerteId: number) {
  const prepared = await prepareOfferteShare(offerteId);
  if ("error" in prepared) return prepared;

  const marked = await markOfferteSent(offerteId, { channel: "share" });
  if ("error" in marked) return { error: marked.error };

  return prepared;
}
