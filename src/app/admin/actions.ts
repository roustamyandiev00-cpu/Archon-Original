"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { getAppOrigin, getStripe, isStripeConfigured } from "@/lib/stripe";
import { untyped } from "@/lib/integraties";
import { syncStripeInvoice } from "@/lib/admin/platform-billing";
import { grantCompanyTokens } from "@/lib/admin/ai-tokens";
import type { Json } from "@/types/database.types";

export async function updateCompanyStatusAction(input: {
  companyId: number;
  status: "active" | "suspended";
}) {
  const { user, serviceSupabase } = await requirePlatformAdmin();

  if (!Number.isSafeInteger(input.companyId) || input.companyId <= 0) {
    return { ok: false as const, error: "Ongeldig bedrijf." };
  }
  if (input.status !== "active" && input.status !== "suspended") {
    return { ok: false as const, error: "Ongeldige accountstatus." };
  }

  const { data: company, error: readError } = await serviceSupabase
    .from("bedrijven")
    .select("id, naam, status, is_active, subscription_status")
    .eq("id", input.companyId)
    .maybeSingle();

  if (readError || !company) {
    return { ok: false as const, error: "Bedrijf niet gevonden." };
  }

  const nextStatus =
    input.status === "suspended"
      ? "suspended"
      : company.subscription_status?.toLowerCase().includes("trial")
        ? "trial"
        : "active";
  const nextIsActive = input.status === "active";
  const correlationId = crypto.randomUUID();
  const before = {
    status: company.status,
    isActive: company.is_active,
    subscriptionStatus: company.subscription_status,
  };
  const after = {
    status: nextStatus,
    isActive: nextIsActive,
    subscriptionStatus: company.subscription_status,
  };

  const { error: auditRequestError } = await serviceSupabase
    .from("audit_logs")
    .insert({
      company_id: input.companyId,
      actor_id: user.id,
      event_category: "platform_admin",
      event_type: `platform.company.${input.status}.requested`,
      severity: input.status === "suspended" ? "warning" : "info",
      target_type: "company",
      target_id: String(input.companyId),
      metadata: {
        correlationId,
        outcome: "requested",
        before,
        after,
      } as Json,
    });

  if (auditRequestError) {
    console.error("platform company status audit:", auditRequestError.message);
    return {
      ok: false as const,
      error: "De beheeractie is gestopt omdat de auditregistratie niet lukte.",
    };
  }

  const alreadyApplied =
    company.status === nextStatus && company.is_active === nextIsActive;

  if (!alreadyApplied) {
    const { data: updated, error: updateError } = await serviceSupabase
      .from("bedrijven")
      .update({
        is_active: nextIsActive,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.companyId)
      .eq("status", company.status)
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      await serviceSupabase.from("audit_logs").insert({
        company_id: input.companyId,
        actor_id: user.id,
        event_category: "platform_admin",
        event_type: `platform.company.${input.status}.failed`,
        severity: "warning",
        target_type: "company",
        target_id: String(input.companyId),
        metadata: {
          correlationId,
          outcome: "failed",
          before,
          after,
        } as Json,
      });
      return {
        ok: false as const,
        error:
          "De accountstatus kon niet worden gewijzigd. Mogelijk werd het bedrijf ondertussen aangepast.",
      };
    }
  }

  const { error: auditResultError } = await serviceSupabase
    .from("audit_logs")
    .insert({
      company_id: input.companyId,
      actor_id: user.id,
      event_category: "platform_admin",
      event_type: `platform.company.${input.status}.completed`,
      severity: input.status === "suspended" ? "warning" : "info",
      target_type: "company",
      target_id: String(input.companyId),
      metadata: {
        correlationId,
        outcome: alreadyApplied ? "already_applied" : "completed",
        before,
        after,
      } as Json,
    });

  revalidatePath("/admin");
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${input.companyId}`);

  return {
    ok: true as const,
    status: nextStatus as "active" | "trial" | "suspended",
    warning: auditResultError
      ? "De status is gewijzigd, maar de afrondende auditregel kon niet worden opgeslagen."
      : null,
  };
}

export async function createStripeBillingPortalAction(input: {
  companyId: number;
}) {
  const { user, serviceSupabase } = await requirePlatformAdmin();

  if (!Number.isSafeInteger(input.companyId) || input.companyId <= 0) {
    return { ok: false as const, error: "Ongeldig bedrijf." };
  }
  if (!isStripeConfigured()) {
    return { ok: false as const, error: "Stripe is niet geconfigureerd." };
  }

  const [{ data: company, error: companyError }, { data: credits, error: creditsError }] =
    await Promise.all([
      serviceSupabase
        .from("bedrijven")
        .select("id, naam")
        .eq("id", input.companyId)
        .maybeSingle(),
      serviceSupabase
        .from("company_ai_credits")
        .select("stripe_customer_id")
        .eq("company_id", input.companyId)
        .maybeSingle(),
    ]);

  if (companyError || !company) {
    return { ok: false as const, error: "Bedrijf niet gevonden." };
  }
  if (creditsError) {
    return {
      ok: false as const,
      error: "De Stripe-koppeling kon niet veilig worden gecontroleerd.",
    };
  }

  const customerId = credits?.stripe_customer_id?.trim();
  if (!customerId || !/^cus_[A-Za-z0-9]+$/.test(customerId)) {
    return {
      ok: false as const,
      error: "Dit bedrijf heeft nog geen geldige gekoppelde Stripe-klant.",
    };
  }

  const stripe = getStripe();
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return {
        ok: false as const,
        error: "De gekoppelde Stripe-klant bestaat niet meer.",
      };
    }
    const metadataCompanyId = customer.metadata.companyId?.trim();
    if (metadataCompanyId && metadataCompanyId !== String(input.companyId)) {
      return {
        ok: false as const,
        error: "De Stripe-klant hoort niet bij het geselecteerde bedrijf.",
      };
    }
  } catch {
    return {
      ok: false as const,
      error: "De gekoppelde Stripe-klant kon niet worden bevestigd.",
    };
  }

  const correlationId = crypto.randomUUID();
  const { error: auditRequestError } = await serviceSupabase
    .from("audit_logs")
    .insert({
      company_id: input.companyId,
      actor_id: user.id,
      event_category: "platform_admin",
      event_type: "platform.billing_portal.requested",
      severity: "warning",
      target_type: "stripe_customer",
      target_id: customerId,
      metadata: { correlationId, outcome: "requested" } as Json,
    });

  if (auditRequestError) {
    console.error("billing portal audit:", auditRequestError.message);
    return {
      ok: false as const,
      error: "Stripe-beheer is gestopt omdat de auditregistratie niet lukte.",
    };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppOrigin()}/admin/companies/${input.companyId}`,
    });
    const portalUrl = new URL(session.url);
    if (
      portalUrl.protocol !== "https:" ||
      portalUrl.hostname !== "billing.stripe.com"
    ) {
      throw new Error("Unexpected billing portal URL");
    }

    const { error: auditResultError } = await serviceSupabase
      .from("audit_logs")
      .insert({
        company_id: input.companyId,
        actor_id: user.id,
        event_category: "platform_admin",
        event_type: "platform.billing_portal.created",
        severity: "warning",
        target_type: "stripe_customer",
        target_id: customerId,
        metadata: {
          correlationId,
          outcome: "completed",
          providerReference: session.id,
        } as Json,
      });

    if (auditResultError) {
      console.error("billing portal result audit:", auditResultError.message);
      return {
        ok: false as const,
        error: "De Stripe-sessie is niet vrijgegeven omdat de audit niet compleet is.",
      };
    }

    return { ok: true as const, url: portalUrl.toString() };
  } catch {
    await serviceSupabase.from("audit_logs").insert({
      company_id: input.companyId,
      actor_id: user.id,
      event_category: "platform_admin",
      event_type: "platform.billing_portal.failed",
      severity: "warning",
      target_type: "stripe_customer",
      target_id: customerId,
      metadata: { correlationId, outcome: "failed" } as Json,
    });
    return {
      ok: false as const,
      error: "Stripe Billing Portal kon niet worden geopend.",
    };
  }
}

export async function addAiCreditsAction(input: {
  companyId: number;
  amount: number;
  idempotencyKey?: string;
  note?: string;
}) {
  const { user, serviceSupabase } = await requirePlatformAdmin();
  if (!Number.isSafeInteger(input.companyId) || input.companyId <= 0) {
    return { ok: false as const, error: "Ongeldig bedrijf." };
  }
  if (
    !Number.isSafeInteger(input.amount) ||
    input.amount < 1 ||
    input.amount > 10_000_000
  ) {
    return {
      ok: false as const,
      error: "AI-credits moeten tussen 1 en 10.000.000 liggen.",
    };
  }
  if (input.note && input.note.trim().length > 500) {
    return { ok: false as const, error: "De auditnotitie is te lang." };
  }

  const result = await grantCompanyTokens(
    serviceSupabase,
    input.companyId,
    input.amount,
    user.id,
    input.idempotencyKey ?? crypto.randomUUID(),
    input.note?.trim() || undefined,
  );
  if (!result.ok) return result;

  revalidatePath(`/admin/companies/${input.companyId}`);
  revalidatePath("/admin/ai-agents");
  revalidatePath("/admin/ai-tokens");

  return {
    ok: true as const,
    applied: result.applied,
    transactionId: result.transactionId,
    creditsBefore: result.creditsBefore,
    creditsAfter: result.creditsAfter,
  };
}

export async function sendPlatformInvoiceAction(input: {
  companyId: number;
  stripeInvoiceId: string;
}) {
  const { user, serviceSupabase } = await requirePlatformAdmin();

  if (!Number.isInteger(input.companyId) || input.companyId <= 0) {
    return { ok: false as const, error: "Ongeldig bedrijf." };
  }
  if (!/^in_[A-Za-z0-9]+$/.test(input.stripeInvoiceId)) {
    return { ok: false as const, error: "Ongeldige Stripe-factuur." };
  }
  if (!isStripeConfigured()) {
    return { ok: false as const, error: "Stripe is niet geconfigureerd." };
  }

  const db = untyped(serviceSupabase);
  const { data: localInvoice, error: readError } = await db
    .from("platform_billing_invoices")
    .select("id, stripe_customer_id, customer_email, status, livemode")
    .eq("company_id", input.companyId)
    .eq("stripe_invoice_id", input.stripeInvoiceId)
    .maybeSingle();

  if (readError || !localInvoice) {
    return { ok: false as const, error: "Factuur niet gevonden bij dit bedrijf." };
  }
  if (localInvoice.status === "draft") {
    return { ok: false as const, error: "Een conceptfactuur kan nog niet worden verstuurd." };
  }
  if (!localInvoice.customer_email) {
    return { ok: false as const, error: "Deze factuur heeft geen e-mailadres van de klant." };
  }

  const { data: delivery, error: logError } = await db
    .from("platform_billing_delivery_logs")
    .insert({
      invoice_id: localInvoice.id,
      company_id: input.companyId,
      requested_by: user.id,
      recipient_email: localInvoice.customer_email,
      provider: "stripe",
      status: "requested",
    })
    .select("id")
    .single();

  if (logError || !delivery?.id) {
    return { ok: false as const, error: "Verzendpoging kon niet worden gelogd." };
  }

  try {
    const stripe = getStripe();
    const remoteInvoice = await stripe.invoices.retrieve(input.stripeInvoiceId);
    const remoteCustomerId =
      typeof remoteInvoice.customer === "string"
        ? remoteInvoice.customer
        : remoteInvoice.customer?.id;

    if (remoteCustomerId !== localInvoice.stripe_customer_id) {
      throw new Error("Stripe-klant komt niet overeen met het geselecteerde bedrijf.");
    }

    await stripe.invoices.sendInvoice(input.stripeInvoiceId);
    await db
      .from("platform_billing_delivery_logs")
      .update({ status: localInvoice.livemode ? "sent" : "test" })
      .eq("id", delivery.id);

    revalidatePath(`/admin/companies/${input.companyId}`);
    return {
      ok: true as const,
      testMode: !localInvoice.livemode,
      recipient: localInvoice.customer_email as string,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe kon de factuur niet versturen.";
    await db
      .from("platform_billing_delivery_logs")
      .update({ status: "failed", error_message: message.slice(0, 1000) })
      .eq("id", delivery.id);
    return { ok: false as const, error: message };
  }
}

export async function syncPlatformInvoicesAction(input: { companyId: number }) {
  const { serviceSupabase } = await requirePlatformAdmin();

  if (!Number.isInteger(input.companyId) || input.companyId <= 0) {
    return { ok: false as const, error: "Ongeldig bedrijf." };
  }
  if (!isStripeConfigured()) {
    return { ok: false as const, error: "Stripe is niet geconfigureerd." };
  }

  const db = untyped(serviceSupabase);
  const { data: creditAccount, error } = await db
    .from("company_ai_credits")
    .select("stripe_customer_id")
    .eq("company_id", input.companyId)
    .maybeSingle();
  const customerId = creditAccount?.stripe_customer_id?.trim();

  if (error || !customerId) {
    return {
      ok: false as const,
      error: "Dit bedrijf heeft nog geen gekoppelde Stripe-klant.",
    };
  }

  try {
    const syncTime = Math.floor(Date.now() / 1000);
    let synced = 0;

    for await (const invoice of getStripe().invoices.list({
      customer: customerId,
      limit: 100,
    })) {
      const result = await syncStripeInvoice(
        serviceSupabase,
        invoice,
        syncTime,
      );
      if (result.synced) synced += 1;
    }

    revalidatePath(`/admin/companies/${input.companyId}`);
    return { ok: true as const, synced };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Stripe-synchronisatie mislukt.",
    };
  }
}
