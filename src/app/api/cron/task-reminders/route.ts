import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  authorizeCronRequest,
  unauthorizedCronResponse,
} from "@/lib/cron/auth";
import {
  addRecurrenceInterval,
  nextOccurrenceKey,
} from "@/lib/tasks/validation";
import type { Database } from "@/types/database.types";

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

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const nowIso = new Date().toISOString();

  const { data: dueReminders } = await supabase
    .from("task_reminders")
    .select("id, company_id, task_id, idempotency_key")
    .eq("status", "pending")
    .lte("remind_at", nowIso)
    .limit(200);

  let remindersSent = 0;
  let remindersSkipped = 0;

  for (const reminder of dueReminders ?? []) {
    const { data: updated, error } = await supabase
      .from("task_reminders")
      .update({
        status: "sent",
        sent_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", reminder.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (error || !updated) {
      remindersSkipped += 1;
      continue;
    }

    await supabase.from("task_activity_logs").insert({
      company_id: reminder.company_id,
      task_id: reminder.task_id,
      event_type: "task.reminder_sent",
      metadata: { idempotency_key: reminder.idempotency_key },
    });
    remindersSent += 1;
  }

  const { data: rules } = await supabase
    .from("task_recurrence_rules")
    .select("*")
    .eq("is_active", true)
    .lte("next_run_at", nowIso)
    .limit(50);

  let recurrenceCreated = 0;
  let recurrenceSkipped = 0;

  for (const rule of rules ?? []) {
    const frequency = rule.frequency as "daily" | "weekly" | "monthly";
    const base = rule.next_run_at ? new Date(rule.next_run_at) : new Date();
    const occurrenceKey = nextOccurrenceKey(frequency, base);

    const { data: existing } = await supabase
      .from("task_recurrence_occurrences")
      .select("id")
      .eq("recurrence_rule_id", rule.id)
      .eq("occurrence_key", occurrenceKey)
      .maybeSingle();

    if (existing) {
      recurrenceSkipped += 1;
      const next = addRecurrenceInterval(base, frequency, rule.interval_count);
      await supabase
        .from("task_recurrence_rules")
        .update({ next_run_at: next.toISOString(), updated_at: nowIso })
        .eq("id", rule.id);
      continue;
    }

    const { data: template } = await supabase
      .from("tasks")
      .select("*")
      .eq("company_id", rule.company_id)
      .eq("recurrence_rule_id", rule.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!template) {
      recurrenceSkipped += 1;
      continue;
    }

    const { data: created, error: createError } = await supabase
      .from("tasks")
      .insert({
        company_id: rule.company_id,
        title: template.title,
        description: template.description,
        status: "todo",
        priority: template.priority,
        assigned_to_user_id: template.assigned_to_user_id,
        contact_id: template.contact_id,
        deal_id: template.deal_id,
        offerte_id: template.offerte_id,
        factuur_id: template.factuur_id,
        project_id: template.project_id,
        afspraak_id: template.afspraak_id,
        source: "recurrence",
        recurrence_rule_id: rule.id,
        metadata: {},
      })
      .select("id")
      .single();

    if (createError || !created) {
      recurrenceSkipped += 1;
      continue;
    }

    await supabase.from("task_recurrence_occurrences").insert({
      company_id: rule.company_id,
      recurrence_rule_id: rule.id,
      occurrence_key: occurrenceKey,
      task_id: created.id,
    });

    const next = addRecurrenceInterval(base, frequency, rule.interval_count);
    await supabase
      .from("task_recurrence_rules")
      .update({ next_run_at: next.toISOString(), updated_at: nowIso })
      .eq("id", rule.id);

    recurrenceCreated += 1;
  }

  return NextResponse.json({
    ok: true,
    remindersSent,
    remindersSkipped,
    recurrenceCreated,
    recurrenceSkipped,
    ranAt: nowIso,
  });
}
