"use server";

import { requireWriteAccess } from "@/components/dashboard/context";
import { getAiTokenPackage } from "@/lib/ai/token-packages";
import { getAppOrigin, getStripe, isStripeConfigured } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { untyped } from "@/lib/integraties";

export async function createAiTokenCheckoutSession(
  packageId: string,
): Promise<{ url: string } | { error: string }> {
  if (!isStripeConfigured()) {
    return {
      error:
        "Online betalen is nog niet geconfigureerd. Zet STRIPE_SECRET_KEY (en webhook) in de omgeving.",
    };
  }

  const pkg = getAiTokenPackage(packageId);
  if (!pkg) return { error: "Onbekend tokenpakket." };

  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { companyId, user } = access;

  const stripe = getStripe();
  const origin = getAppOrigin();
  const admin = createServiceClient();

  const { data: purchase, error: purchaseError } = await untyped(admin)
    .from("ai_token_purchases")
    .insert({
      company_id: companyId,
      tokens_purchased: pkg.tokens,
      amount_eur: pkg.price,
      status: "pending",
      metadata: {
        package_id: pkg.id,
        package_name: pkg.name,
        user_id: user.id,
      },
    })
    .select("id")
    .single();

  if (purchaseError || !purchase?.id) {
    return {
      error: purchaseError?.message ?? "Aankoop kon niet worden aangemaakt.",
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/dashboard/instellingen?tab=ai&credits=success`,
      cancel_url: `${origin}/dashboard/instellingen?tab=ai&credits=cancel`,
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(pkg.price * 100),
            product_data: {
              name: `${pkg.name} — ${pkg.tokens.toLocaleString("nl-BE")} AI-tokens`,
              description: "ArchonPro AI-tegoed",
            },
          },
        },
      ],
      metadata: {
        companyId: String(companyId),
        tokensToAdd: String(pkg.tokens),
        packageId: pkg.id,
        purchaseId: String(purchase.id),
        amountEur: String(pkg.price),
      },
      client_reference_id: String(companyId),
    });

    if (!session.url) {
      return { error: "Stripe Checkout-URL ontbreekt." };
    }

    await untyped(admin)
      .from("ai_token_purchases")
      .update({ stripe_session_id: session.id })
      .eq("id", purchase.id);

    return { url: session.url };
  } catch (err) {
    await untyped(admin)
      .from("ai_token_purchases")
      .update({ status: "failed" })
      .eq("id", purchase.id);

    return {
      error: err instanceof Error ? err.message : "Stripe Checkout mislukt.",
    };
  }
}
