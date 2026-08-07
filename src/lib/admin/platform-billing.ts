import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type TypedSupabase = SupabaseClient<Database>;

export type PlatformBillingInvoice = {
  id: number;
  stripeInvoiceId: string;
  number: string | null;
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  currency: string;
  amountDue: number;
  amountPaid: number;
  customerEmail: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  livemode: boolean;
  createdAt: string;
};

type BillingInvoiceRow = {
  id: number;
  stripe_invoice_id: string;
  number: string | null;
  status: PlatformBillingInvoice["status"];
  currency: string;
  amount_due: number;
  amount_paid: number;
  customer_email: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  livemode: boolean;
  created_at: string;
};

function stripeId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function epochToIso(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

export function stripeInvoiceToRow(
  invoice: Stripe.Invoice,
  companyId: number,
  eventCreated: number,
) {
  const subscription = invoice.parent?.subscription_details?.subscription;

  return {
    company_id: companyId,
    stripe_invoice_id: invoice.id,
    stripe_customer_id: stripeId(invoice.customer) ?? "",
    stripe_subscription_id: stripeId(subscription),
    number: invoice.number,
    status: invoice.status ?? "draft",
    billing_reason: invoice.billing_reason,
    currency: invoice.currency.toLowerCase(),
    amount_due: invoice.amount_due,
    amount_paid: invoice.amount_paid,
    customer_email: invoice.customer_email,
    hosted_invoice_url: invoice.hosted_invoice_url,
    invoice_pdf_url: invoice.invoice_pdf,
    period_start: epochToIso(invoice.period_start),
    period_end: epochToIso(invoice.period_end),
    paid_at: epochToIso(invoice.status_transitions.paid_at),
    livemode: invoice.livemode,
    last_event_created_at: new Date(eventCreated * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function resolveCompanyId(
  supabase: TypedSupabase,
  invoice: Stripe.Invoice,
): Promise<number | null> {
  const customerId = stripeId(invoice.customer);
  if (customerId) {
    const { data } = await supabase
      .from("company_ai_credits")
      .select("company_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data?.company_id) return Number(data.company_id);
  }

  const metadataCompanyId = Number(invoice.metadata?.companyId);
  if (Number.isInteger(metadataCompanyId) && metadataCompanyId > 0) {
    const { data } = await supabase
      .from("bedrijven")
      .select("id")
      .eq("id", metadataCompanyId)
      .maybeSingle();
    if (data?.id) return Number(data.id);
  }

  return null;
}

export async function syncStripeInvoice(
  supabase: TypedSupabase,
  invoice: Stripe.Invoice,
  eventCreated: number,
) {
  const companyId = await resolveCompanyId(supabase, invoice);
  if (!companyId) return { synced: false as const, reason: "company_not_found" };

  const eventIso = new Date(eventCreated * 1000).toISOString();
  const { data: existing } = await supabase
    .from("platform_billing_invoices")
    .select("last_event_created_at")
    .eq("stripe_invoice_id", invoice.id)
    .maybeSingle();

  if (
    existing?.last_event_created_at &&
    new Date(existing.last_event_created_at).getTime() > new Date(eventIso).getTime()
  ) {
    return { synced: false as const, reason: "stale_event" };
  }

  const row = stripeInvoiceToRow(invoice, companyId, eventCreated);
  if (!row.stripe_customer_id) {
    return { synced: false as const, reason: "customer_not_found" };
  }

  const { error } = await supabase
    .from("platform_billing_invoices")
    .upsert(row, { onConflict: "stripe_invoice_id" });

  if (error) throw new Error(`Stripe-factuur opslaan mislukt: ${error.message}`);
  return { synced: true as const, companyId };
}

export async function fetchPlatformBillingInvoices(
  supabase: TypedSupabase,
  companyId: number,
): Promise<PlatformBillingInvoice[]> {
  const { data, error } = await supabase
    .from("platform_billing_invoices")
    .select(
      "id, stripe_invoice_id, number, status, currency, amount_due, amount_paid, customer_email, hosted_invoice_url, invoice_pdf_url, period_start, period_end, paid_at, livemode, created_at",
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(50);

  // De pagina blijft bruikbaar tijdens een gecontroleerde rollout waarin de
  // applicatiecode kort vóór de migratie beschikbaar kan zijn.
  if (error?.code === "42P01") return [];
  if (error) throw new Error(`Platformfacturen laden mislukt: ${error.message}`);

  return ((data ?? []) as BillingInvoiceRow[]).map((row) => ({
    id: row.id,
    stripeInvoiceId: row.stripe_invoice_id,
    number: row.number,
    status: row.status,
    currency: row.currency,
    amountDue: row.amount_due,
    amountPaid: row.amount_paid,
    customerEmail: row.customer_email,
    hostedInvoiceUrl: row.hosted_invoice_url,
    invoicePdfUrl: row.invoice_pdf_url,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    paidAt: row.paid_at,
    livemode: row.livemode,
    createdAt: row.created_at,
  }));
}
