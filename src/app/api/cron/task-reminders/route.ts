import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { untyped } from "@/lib/integraties";
import {
  authorizeCronRequest,
  unauthorizedCronResponse,
} from "@/lib/cron/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Idempotent task reminder dispatcher. Safe under overlapping cron runs. */
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

  const now = new Date().toISOString();
  const { data: due, error } = await untyped(supabase)
    .from("task_reminders")
    .select("id, company_id, task_id, channel, idempotency_key")
    .eq("status", "pending")
    .lte("remind_at", now)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  const results: Array<{ id: number; status: string }> = [];

  for (const reminder of due ?? []) {
    // Claim row first (idempotent under concurrency).
    const { data: claimed, error: claimError } = await untyped(supabase)
      .from("task_reminders")
      .update({
        status: "sent",
        sent_at: now,
        updated_at: now,
      })
      .eq("id", reminder.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (claimError) {
      results.push({ id: reminder.id, status: "error" });
      continue;
    }
    if (!claimed) {
      skipped += 1;
      results.push({ id: reminder.id, status: "skipped" });
      continue;
    }

    await untyped(supabase).from("task_activity_logs").insert({
      company_id: reminder.company_id,
      task_id: reminder.task_id,
      actor_id: null,
      event_type: "task.reminder_sent",
      metadata: {
        channel: reminder.channel,
        idempotency_key: reminder.idempotency_key,
      },
    });

    sent += 1;
    results.push({ id: reminder.id, status: "sent" });
  }

  return NextResponse.json({
    ok: true,
    due: (due ?? []).length,
    sent,
    skipped,
    results,
    ranAt: now,
  });
}
