import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type StripeWebhookEventStatus =
  | "processing"
  | "processed"
  | "failed"
  | "ignored";

export type ClaimResult =
  | { outcome: "claimed"; rowId: string; attempts: number }
  | { outcome: "duplicate"; status: StripeWebhookEventStatus }
  | { outcome: "retry"; rowId: string; attempts: number };

type StripeWebhookEventRow =
  Database["public"]["Tables"]["stripe_webhook_events"]["Row"];

export function hashStripePayload(rawBody: string): string {
  return crypto.createHash("sha256").update(rawBody).digest("hex");
}

/**
 * Registreert een Stripe event vóór business processing.
 * - Nieuw → claimed (processing)
 * - Al processed/ignored → duplicate
 * - Failed → retry (attempts++)
 * - Processing (race) → duplicate
 */
export async function claimStripeWebhookEvent(
  supabase: SupabaseClient<Database>,
  input: {
    stripeEventId: string;
    eventType: string;
    livemode: boolean;
    payloadHash: string;
  },
): Promise<ClaimResult> {
  const { data: existing, error: readError } = await supabase
    .from("stripe_webhook_events")
    .select("*")
    .eq("stripe_event_id", input.stripeEventId)
    .maybeSingle();

  if (readError) {
    throw new Error(`stripe_webhook_events read: ${readError.message}`);
  }

  if (existing) {
    return handleExisting(supabase, existing);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("stripe_webhook_events")
    .insert({
      stripe_event_id: input.stripeEventId,
      event_type: input.eventType,
      livemode: input.livemode,
      status: "processing",
      payload_hash: input.payloadHash,
      attempts: 1,
    })
    .select("id, attempts")
    .maybeSingle();

  if (insertError) {
    // Unique race: andere worker won
    if (insertError.code === "23505") {
      const { data: raced } = await supabase
        .from("stripe_webhook_events")
        .select("*")
        .eq("stripe_event_id", input.stripeEventId)
        .maybeSingle();
      if (raced) return handleExisting(supabase, raced);
    }
    throw new Error(`stripe_webhook_events insert: ${insertError.message}`);
  }

  if (!inserted) {
    throw new Error("stripe_webhook_events insert: geen rij terug");
  }

  return {
    outcome: "claimed",
    rowId: inserted.id,
    attempts: inserted.attempts,
  };
}

async function handleExisting(
  supabase: SupabaseClient<Database>,
  existing: StripeWebhookEventRow,
): Promise<ClaimResult> {
  if (existing.status === "processed" || existing.status === "ignored") {
    return { outcome: "duplicate", status: existing.status };
  }

  if (existing.status === "processing") {
    return { outcome: "duplicate", status: "processing" };
  }

  // failed → retry
  const nextAttempts = existing.attempts + 1;
  const { error } = await supabase
    .from("stripe_webhook_events")
    .update({
      status: "processing",
      attempts: nextAttempts,
      processing_started_at: new Date().toISOString(),
      failed_at: null,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .eq("status", "failed");

  if (error) {
    throw new Error(`stripe_webhook_events retry: ${error.message}`);
  }

  return { outcome: "retry", rowId: existing.id, attempts: nextAttempts };
}

export async function completeStripeWebhookEvent(
  supabase: SupabaseClient<Database>,
  rowId: string,
  status: "processed" | "ignored" = "processed",
): Promise<void> {
  const { error } = await supabase
    .from("stripe_webhook_events")
    .update({
      status,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", rowId);

  if (error) {
    console.error("stripe_webhook_events complete:", error.message);
  }
}

export async function failStripeWebhookEvent(
  supabase: SupabaseClient<Database>,
  rowId: string,
  lastError: string,
): Promise<void> {
  const { error } = await supabase
    .from("stripe_webhook_events")
    .update({
      status: "failed",
      failed_at: new Date().toISOString(),
      last_error: lastError.slice(0, 1000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", rowId);

  if (error) {
    console.error("stripe_webhook_events fail:", error.message);
  }
}
