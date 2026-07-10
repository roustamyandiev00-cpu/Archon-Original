import { NextResponse } from "next/server";
import { untyped } from "@/lib/integraties";
import { syncBillitPeppolInbox } from "@/lib/peppol/inbox";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Supabase service role niet geconfigureerd." },
      { status: 500 },
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: integrations } = await untyped(supabase)
    .from("integraties")
    .select("bedrijf_id, config, status")
    .eq("provider", "peppol")
    .eq("status", "connected");

  const targets = (integrations ?? []).filter((row) => {
    const cfg = (row.config ?? {}) as Record<string, string>;
    return (
      cfg.accessPoint === "billit" &&
      String(cfg.autoSyncInbox) === "true" &&
      cfg.apiKey?.trim() &&
      (cfg.partyId?.trim() || cfg.legalEntityId?.trim())
    );
  });

  const results: {
    companyId: number;
    imported: number;
    skipped: number;
    error?: string;
  }[] = [];

  for (const row of targets) {
    const result = await syncBillitPeppolInbox(supabase, row.bedrijf_id);
    if (result.ok) {
      results.push({
        companyId: row.bedrijf_id,
        imported: result.imported,
        skipped: result.skipped,
      });

      const cfg = (row.config ?? {}) as Record<string, string>;
      await untyped(supabase)
        .from("integraties")
        .update({
          config: {
            ...cfg,
            lastInboxSyncAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("bedrijf_id", row.bedrijf_id)
        .eq("provider", "peppol");
    } else {
      results.push({
        companyId: row.bedrijf_id,
        imported: 0,
        skipped: 0,
        error: result.error,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    companies: targets.length,
    results,
  });
}
