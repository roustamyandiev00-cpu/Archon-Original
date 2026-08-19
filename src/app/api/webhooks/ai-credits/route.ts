import { NextResponse } from "next/server";
import { grantAiCreditsAfterPayment } from "@/lib/ai/grant-credits";
import { createServiceClient } from "@/lib/supabase/service";

type WebhookBody = {
  companyId: number;
  tokensToAdd: number;
  purchaseId?: string;
  amountEur?: number;
};

/**
 * Webhook voor betaling → AI-tegoed (Stripe/Mollie later).
 * Vereist AI_CREDITS_WEBHOOK_SECRET in de Authorization: Bearer … header.
 */
export async function POST(request: Request) {
  const secret = process.env.AI_CREDITS_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret is niet geconfigureerd." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const companyId = Number(body.companyId);
  const tokensToAdd = Number(body.tokensToAdd);

  if (!Number.isFinite(companyId) || companyId <= 0) {
    return NextResponse.json({ error: "companyId ontbreekt of ongeldig" }, { status: 400 });
  }
  if (!Number.isFinite(tokensToAdd) || tokensToAdd <= 0) {
    return NextResponse.json({ error: "tokensToAdd moet positief zijn" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const result = await grantAiCreditsAfterPayment(supabase, {
      companyId,
      tokensToAdd,
      purchaseId: body.purchaseId,
      amountEur: body.amountEur,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, companyId, tokensToAdd });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Webhook mislukt";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
