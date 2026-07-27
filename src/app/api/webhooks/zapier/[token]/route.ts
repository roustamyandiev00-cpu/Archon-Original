import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { untyped } from "@/lib/integraties";
import { findCompanyByZapierToken } from "@/lib/zapier-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Inbound Zapier webhook per bedrijf.
 * Zapier Catch Hook / Webhooks by Zapier POST hierheen.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Ongeldige webhook." }, { status: 404 });
  }

  const supabase = createServiceClient();
  const match = await findCompanyByZapierToken(supabase, token);
  if (!match) {
    return NextResponse.json({ error: "Onbekende webhook." }, { status: 404 });
  }

  let payload: unknown = null;
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const text = await req.text();
      payload = text ? { raw: text } : {};
    }
  } catch {
    payload = {};
  }

  const now = new Date().toISOString();
  const nextConfig = {
    ...match.config,
    webhookToken: token,
    lastInboundAt: now,
    lastInboundPreview:
      typeof payload === "object" && payload != null
        ? JSON.stringify(payload).slice(0, 500)
        : String(payload).slice(0, 500),
  };

  await untyped(supabase)
    .from("integraties")
    .update({
      config: nextConfig,
      updated_at: now,
    })
    .eq("bedrijf_id", match.companyId)
    .eq("provider", "zapier");

  return NextResponse.json({
    ok: true,
    received: true,
    companyId: match.companyId,
  });
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Ongeldige webhook." }, { status: 404 });
  }

  const supabase = createServiceClient();
  const match = await findCompanyByZapierToken(supabase, token);
  if (!match) {
    return NextResponse.json({ error: "Onbekende webhook." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    provider: "zapier",
    message: "Webhook actief. Stuur events via POST.",
  });
}
