"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminAccess } from "@/components/dashboard/context";
import {
  GMAIL_SMTP,
  loadCompanySmtpSettings,
  sendCompanyEmail,
  verifyCompanySmtp,
  type CompanySmtpSettings,
} from "@/components/dashboard/email/smtp";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";

export type SmtpSettingsInput = {
  preset: "gmail" | "custom";
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  from_email: string;
  from_name: string;
};

export type SmtpSettingsView = {
  preset: "gmail" | "custom";
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  from_email: string;
  from_name: string;
  hasPassword: boolean;
};

function resolveHostPort(input: SmtpSettingsInput) {
  if (input.preset === "gmail") {
    return { smtp_host: GMAIL_SMTP.smtp_host, smtp_port: GMAIL_SMTP.smtp_port };
  }
  return {
    smtp_host: input.smtp_host.trim() || GMAIL_SMTP.smtp_host,
    smtp_port: Number.isFinite(input.smtp_port) ? input.smtp_port : 587,
  };
}

async function resolvePassword(
  supabase: SupabaseClient,
  companyId: number,
  newPass: string,
): Promise<string | null> {
  const trimmed = newPass.trim();
  if (trimmed) return trimmed;

  const { data } = await supabase
    .from("bedrijf_smtp_instellingen")
    .select("smtp_pass")
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!data?.smtp_pass) return null;
  try {
    return decryptSecret(data.smtp_pass);
  } catch {
    return null;
  }
}

function toSettings(
  input: SmtpSettingsInput,
  password: string,
): CompanySmtpSettings {
  const { smtp_host, smtp_port } = resolveHostPort(input);
  return {
    smtp_host,
    smtp_port,
    smtp_user: input.smtp_user.trim(),
    smtp_pass: password,
    from_email: input.from_email.trim(),
    from_name: input.from_name.trim(),
  };
}

export async function saveSmtpSettings(
  input: SmtpSettingsInput,
): Promise<{ ok: true } | { error: string }> {
  const access = await requireAdminAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  if (!input.smtp_user.trim()) {
    return { error: "SMTP-gebruikersnaam is verplicht." };
  }
  if (!input.from_email.trim()) {
    return { error: "Afzender-e-mailadres is verplicht." };
  }

  const password = await resolvePassword(supabase, companyId, input.smtp_pass);
  if (!password) {
    return {
      error:
        "App-wachtwoord is verplicht. Voor Gmail: maak een app-wachtwoord aan in je Google-account.",
    };
  }

  const { smtp_host, smtp_port } = resolveHostPort(input);
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("bedrijf_smtp_instellingen")
    .select("bedrijf_id")
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  const row = {
    smtp_host,
    smtp_port,
    smtp_user: input.smtp_user.trim(),
    smtp_pass: encryptSecret(password),
    from_email: input.from_email.trim(),
    from_name: input.from_name.trim() || input.from_email.trim(),
    updated_at: now,
  };

  const { error } = existing
    ? await supabase
        .from("bedrijf_smtp_instellingen")
        .update(row)
        .eq("bedrijf_id", companyId)
    : await supabase.from("bedrijf_smtp_instellingen").insert({
        bedrijf_id: companyId,
        ...row,
      });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/instellingen");
  return { ok: true };
}

export async function testSmtpSettings(
  input: SmtpSettingsInput,
  testRecipient?: string,
): Promise<{ ok: true } | { error: string }> {
  const access = await requireAdminAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const password = await resolvePassword(supabase, companyId, input.smtp_pass);
  if (!password) {
    return { error: "Vul eerst je SMTP-wachtwoord of Gmail app-wachtwoord in." };
  }

  const settings = toSettings(input, password);
  const verify = await verifyCompanySmtp(settings);
  if ("error" in verify) return verify;

  const to = (testRecipient || input.from_email).trim();
  if (!to) return { error: "Geen testontvanger opgegeven." };

  const sent = await sendCompanyEmail(settings, {
    to,
    subject: "ArchonPro — SMTP-test geslaagd",
    text: [
      "Dit is een testmail vanuit ArchonPro.",
      "",
      "Je SMTP-instellingen werken. Incasso- en documentmails worden vanaf nu automatisch verstuurd.",
      "",
      `Verzonden op: ${new Date().toLocaleString("nl-BE")}`,
    ].join("\n"),
  });

  if ("error" in sent) return sent;
  return { ok: true };
}

export async function sendEmailViaCompanySmtp(
  supabase: Parameters<typeof loadCompanySmtpSettings>[0],
  companyId: number,
  input: Parameters<typeof sendCompanyEmail>[1],
): Promise<
  | { ok: true; messageId: string }
  | { error: string; smtpMissing?: boolean }
> {
  const settings = await loadCompanySmtpSettings(supabase, companyId);
  if (!settings) {
    return {
      error:
        "SMTP niet geconfigureerd. Ga naar Instellingen → Integraties en koppel Gmail of je SMTP-server.",
      smtpMissing: true,
    };
  }

  return sendCompanyEmail(settings, input);
}
