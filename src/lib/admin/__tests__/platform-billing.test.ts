import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { stripeInvoiceToRow } from "@/lib/admin/platform-billing";

describe("stripeInvoiceToRow", () => {
  it("bewaart bedragen in centen en Stripe-koppelingen zonder afronding", () => {
    const invoice = {
      id: "in_test123",
      customer: "cus_test123",
      number: "AP-2026-0001",
      status: "paid",
      billing_reason: "manual",
      currency: "eur",
      amount_due: 5900,
      amount_paid: 5900,
      customer_email: "klant@example.com",
      hosted_invoice_url: "https://invoice.stripe.com/test",
      invoice_pdf: "https://pay.stripe.com/invoice/test/pdf",
      period_start: 1_721_606_400,
      period_end: 1_724_284_800,
      livemode: false,
      metadata: { companyId: "42" },
      parent: {
        type: "subscription_details",
        subscription_details: { subscription: "sub_test123", metadata: {} },
      },
      status_transitions: {
        finalized_at: 1_721_606_500,
        marked_uncollectible_at: null,
        paid_at: 1_721_606_600,
        voided_at: null,
      },
    } as unknown as Stripe.Invoice;

    const row = stripeInvoiceToRow(invoice, 42, 1_721_606_700);

    expect(row).toMatchObject({
      company_id: 42,
      stripe_invoice_id: "in_test123",
      stripe_customer_id: "cus_test123",
      stripe_subscription_id: "sub_test123",
      status: "paid",
      currency: "eur",
      amount_due: 5900,
      amount_paid: 5900,
      customer_email: "klant@example.com",
      livemode: false,
    });
    expect(row.paid_at).toBe("2024-07-22T00:03:20.000Z");
  });
});
