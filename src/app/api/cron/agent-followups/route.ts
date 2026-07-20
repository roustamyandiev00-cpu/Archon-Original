import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runAllSchedulersForAllTenants } from "@/lib/agents/scheduler";
import {
  authorizeCronRequest,
  unauthorizedCronResponse,
} from "@/lib/cron/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCronRequest(req)) {
    return unauthorizedCronResponse();
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

  const result = await runAllSchedulersForAllTenants(supabase);

  return NextResponse.json({
    ok: true,
    ...result,
    ranAt: new Date().toISOString(),
  });
}
