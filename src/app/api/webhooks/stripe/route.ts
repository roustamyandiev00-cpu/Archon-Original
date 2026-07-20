import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { grantAiCreditsAfterPayment } from "@/lib/ai/grant-credits";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { untyped } from "@/lib/integraties";
import { syncStripeInvoice } from "@/lib/admin/platform-billing";

export const runtime = "nodejs";

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const companyId = Number(session.metadata?.companyId);
  const tokensToAdd = Number(session.metadata?.tokensToAdd);
  const purchaseId = session.metadata?.purchaseId?.trim() || undefined;
  const amountEur = Number(session.metadata?.amountEur);

  if (!Number.isFinite(companyId) || companyId <= 0) {
    return { error: "companyId ontbreekt in Stripe metadata" };
  }
  if (!Number.isFinite(tokensToAdd) || tokensToAdd <= 0) {
    return { error: "tokensToAdd ontbreekt in Stripe metadata" };
  }

  const supabase = createServiceClient();

  if (purchaseId) {
    const { data: existing } = await untyped(supabase)
      .from("ai_token_purchases")
      .select("id, status")
      .eq("id", purchaseId)
      .maybeSingle();

    if (existing?.status === "completed") {
      return { ok: true as const, alreadyCompleted: true };
    }
  }

  const grant = await grantAiCreditsAfterPayment(supabase, {
    companyId,
    tokensToAdd,
    purchaseId,
    amountEur: Number.isFinite(amountEur) ? amountEur : undefined,
  });

  if (!grant.ok) return { error: grant.error };

  if (purchaseId) {
    await untyped(supabase)
      .from("ai_token_purchases")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
      })
      .eq("id", purchaseId);
  }

  if (session.customer && typeof session.customer === "string") {
    await untyped(supabase)
      .from("company_ai_credits")
      .update({ stripe_customer_id: session.customer })
      .eq("company_id", companyId);
  }

  return { ok: true as const };
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is niet geconfigureerd." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid" || session.status === "complete") {
        const result = await fulfillCheckoutSession(session);
        if ("error" in result && result.error) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
      }
    } else if (
      event.type === "invoice.created" ||
      event.type === "invoice.finalized" ||
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_succeeded" ||
      event.type === "invoice.payment_failed" ||
      event.type === "invoice.voided" ||
      event.type === "invoice.marked_uncollectible"
    ) {
      await syncStripeInvoice(
        createServiceClient(),
        event.data.object as Stripe.Invoice,
        event.created,
      );
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
