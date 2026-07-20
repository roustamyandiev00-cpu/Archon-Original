import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { grantAiCreditsAfterPayment } from "@/lib/ai/grant-credits";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { untyped } from "@/lib/integraties";
import {
  claimStripeWebhookEvent,
  completeStripeWebhookEvent,
  failStripeWebhookEvent,
  hashStripePayload,
} from "@/lib/stripe/webhook-events";

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
    // Invalid signature: do NOT register in stripe_webhook_events.
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceClient();
  const payloadHash = hashStripePayload(rawBody);
  const claim = await claimStripeWebhookEvent(supabase, {
    stripeEventId: event.id,
    eventType: event.type,
    livemode: Boolean(event.livemode),
    payloadHash,
  });

  if (claim.outcome === "error") {
    console.error("stripe webhook claim:", claim.error);
    return NextResponse.json({ error: claim.error }, { status: 500 });
  }

  if (claim.outcome === "duplicate") {
    return NextResponse.json({
      received: true,
      duplicate: true,
      status: claim.status,
    });
  }

  const rowId = claim.rowId;

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid" || session.status === "complete") {
        const result = await fulfillCheckoutSession(session);
        if ("error" in result && result.error) {
          await failStripeWebhookEvent(supabase, rowId, result.error);
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
      }
    }

    await completeStripeWebhookEvent(supabase, rowId, "processed");
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    await failStripeWebhookEvent(supabase, rowId, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
