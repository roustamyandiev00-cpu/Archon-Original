"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmailViaCompanySmtp } from "@/app/dashboard/instellingen/smtp-actions";
import type { SendQuoteFollowupPayload } from "@/lib/agents/types";
import {
  buildQuoteFollowupContext,
  isQuoteEligibleForFollowup,
} from "@/lib/agents/context/quote-followup";
import { isExpired } from "@/lib/agents/workflow";

function mailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function executeQuoteFollowup(input: {
  supabase: SupabaseClient;
  companyId: number;
  userId: string;
  payload: SendQuoteFollowupPayload;
  meta?: Record<string, unknown>;
}): Promise<
  | { ok: true; mailto?: string; sentViaSmtp?: boolean }
  | { error: string; blocked?: boolean }
> {
  const { supabase, companyId, userId, payload } = input;
  const meta = (payload._meta ?? input.meta ?? {}) as Record<string, unknown>;

  const expiresAt = meta.expiresAt as string | undefined;
  if (isExpired(expiresAt)) {
    return { error: "Voorstel is verlopen.", blocked: true };
  }

  const ctx = await buildQuoteFollowupContext(
    supabase,
    companyId,
    payload.offerteId,
  );
  if (!ctx) return { error: "Offerte niet gevonden." };

  const eligibility = isQuoteEligibleForFollowup(ctx);
  if (!eligibility.eligible) {
    return {
      error: eligibility.reason ?? "Offerte niet meer geschikt voor opvolging.",
      blocked: true,
    };
  }

  const email = payload.recipientEmail ?? ctx.customerEmail;
  const draftMessage = payload.draftMessage;
  const subject = `Opvolging offerte ${ctx.nummer}`;

  let sentViaSmtp = false;
  let mailto: string | undefined;

  if (email) {
    const smtp = await sendEmailViaCompanySmtp(supabase, companyId, {
      to: email,
      subject,
      text: draftMessage,
    });

    if ("ok" in smtp && smtp.ok) {
      sentViaSmtp = true;
    } else {
      mailto = mailtoUrl(email, subject, draftMessage);
    }
  } else {
    return {
      error: "Geen e-mailadres beschikbaar voor deze klant.",
      blocked: true,
    };
  }

  await supabase.from("offerte_email_log").insert({
    bedrijf_id: companyId,
    offerte_id: payload.offerteId,
    recipient_email: email,
    sent_by: userId,
    status: sentViaSmtp ? "followup_sent" : "followup_prepared",
  });

  return { ok: true, mailto, sentViaSmtp };
}
