import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { untyped } from "@/lib/integraties";

export type StripeWebhookClaimResult =
  | { outcome: "claimed"; rowId: string }
  | { outcome: "duplicate"; status: string }
  | { outcome: "retry"; rowId: string; attempts: number }
  | { outcome: "error"; error: string };

export function hashStripePayload(rawBody: string): string {
  return crypto.createHash("sha256").update(rawBody).digest("hex");
}

/**
 * Registers a Stripe event before business processing.
 * - New event → claimed (status=processing)
 * - Already processed/ignored → duplicate
 * - Previously failed → retry (attempts++)
 * Unique stripe_event_id prevents races.
 */
export async function claimStripeWebhookEvent(
  supabase: SupabaseClient,
  input: {
    stripeEventId: string;
    eventType: string;
    livemode: boolean;
    payloadHash: string;
  },
): Promise<StripeWebhookClaimResult> {
  const db = untyped(supabase);

  const { data: existing, error: readError } = await db
    .from("stripe_webhook_events")
    .select("id, status, attempts")
    .eq("stripe_event_id", input.stripeEventId)
    .maybeSingle();

  if (readError) {
    return { outcome: "error", error: readError.message };
  }

  if (existing) {
    if (existing.status === "processed" || existing.status === "ignored") {
      return { outcome: "duplicate", status: existing.status };
    }
    if (existing.status === "failed" || existing.status === "processing") {
      const attempts = Number(existing.attempts ?? 1) + 1;
      const { error: updateError } = await db
        .from("stripe_webhook_events")
        .update({
          status: "processing",
          attempts,
          processing_started_at: new Date().toISOString(),
          last_error: null,
          failed_at: null,
          payload_hash: input.payloadHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .eq("status", existing.status);
      if (updateError) {
        return { outcome: "error", error: updateError.message };
      }
      return { outcome: "retry", rowId: existing.id, attempts };
    }
    return { outcome: "duplicate", status: String(existing.status) };
  }

  const { data: inserted, error: insertError } = await db
    .from("stripe_webhook_events")
    .insert({
      stripe_event_id: input.stripeEventId,
      event_type: input.eventType,
      livemode: input.livemode,
      status: "processing",
      payload_hash: input.payloadHash,
      attempts: 1,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    // Race: another worker inserted first
    if (insertError.code === "23505" || /duplicate|unique/i.test(insertError.message)) {
      return { outcome: "duplicate", status: "processing" };
    }
    return { outcome: "error", error: insertError.message };
  }

  if (!inserted?.id) {
    return { outcome: "error", error: "Kon Stripe-event niet claimen." };
  }

  return { outcome: "claimed", rowId: inserted.id };
}

export async function completeStripeWebhookEvent(
  supabase: SupabaseClient,
  rowId: string,
  status: "processed" | "ignored" = "processed",
): Promise<void> {
  const { error } = await untyped(supabase)
    .from("stripe_webhook_events")
    .update({
      status,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", rowId);
  if (error) {
    console.error("stripe webhook complete:", error.message);
  }
}

export async function failStripeWebhookEvent(
  supabase: SupabaseClient,
  rowId: string,
  lastError: string,
): Promise<void> {
  const { error } = await untyped(supabase)
    .from("stripe_webhook_events")
    .update({
      status: "failed",
      failed_at: new Date().toISOString(),
      last_error: lastError.slice(0, 1000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", rowId);
  if (error) {
    console.error("stripe webhook fail:", error.message);
  }
}
