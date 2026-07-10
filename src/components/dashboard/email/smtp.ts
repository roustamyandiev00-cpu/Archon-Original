import type { SupabaseClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { GMAIL_SMTP } from "@/components/dashboard/email/smtp-constants";

export type { SmtpPreset } from "@/components/dashboard/email/smtp-constants";
export { GMAIL_SMTP } from "@/components/dashboard/email/smtp-constants";

export type CompanySmtpSettings = {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  from_email: string;
  from_name: string;
};

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
};

export async function loadCompanySmtpSettings(
  supabase: SupabaseClient,
  companyId: number,
): Promise<CompanySmtpSettings | null> {
  const { data } = await supabase
    .from("bedrijf_smtp_instellingen")
    .select(
      "smtp_host, smtp_port, smtp_user, smtp_pass, from_email, from_name",
    )
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!data?.smtp_user || !data.smtp_pass || !data.from_email) return null;

  return {
    smtp_host: data.smtp_host || GMAIL_SMTP.smtp_host,
    smtp_port: data.smtp_port || GMAIL_SMTP.smtp_port,
    smtp_user: data.smtp_user,
    smtp_pass: data.smtp_pass,
    from_email: data.from_email,
    from_name: data.from_name || "",
  };
}

export function isSmtpConfigured(
  settings: CompanySmtpSettings | null,
): settings is CompanySmtpSettings {
  return Boolean(
    settings?.smtp_host &&
      settings.smtp_port &&
      settings.smtp_user &&
      settings.smtp_pass &&
      settings.from_email,
  );
}

function createTransport(settings: CompanySmtpSettings) {
  return nodemailer.createTransport({
    host: settings.smtp_host,
    port: settings.smtp_port,
    secure: settings.smtp_port === 465,
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_pass,
    },
  });
}

export async function sendCompanyEmail(
  settings: CompanySmtpSettings,
  input: SendEmailInput,
): Promise<{ ok: true; messageId: string } | { error: string }> {
  try {
    const transport = createTransport(settings);
    const info = await transport.sendMail({
      from: settings.from_name
        ? `"${settings.from_name}" <${settings.from_email}>`
        : settings.from_email,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType ?? "application/pdf",
      })),
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "E-mail verzenden mislukt.";
    return { error: message };
  }
}

export async function verifyCompanySmtp(
  settings: CompanySmtpSettings,
): Promise<{ ok: true } | { error: string }> {
  try {
    const transport = createTransport(settings);
    await transport.verify();
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "SMTP-verbinding mislukt.";
    return { error: message };
  }
}
