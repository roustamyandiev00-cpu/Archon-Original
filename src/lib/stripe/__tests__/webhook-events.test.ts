import { beforeEach, describe, expect, it, vi } from "vitest";

const from = vi.fn();

vi.mock("@/lib/integraties", () => ({
  untyped: (value: unknown) => value,
}));

import {
  claimStripeWebhookEvent,
  completeStripeWebhookEvent,
  failStripeWebhookEvent,
  hashStripePayload,
} from "@/lib/stripe/webhook-events";

function mockSupabase() {
  return { from } as never;
}

describe("stripe webhook event ledger", () => {
  beforeEach(() => {
    from.mockReset();
  });

  it("hasht payloads stabiel", () => {
    expect(hashStripePayload("abc")).toBe(hashStripePayload("abc"));
    expect(hashStripePayload("abc")).not.toBe(hashStripePayload("abcd"));
  });

  it("claimed een nieuw event", async () => {
    const maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    const insertMaybe = vi.fn(async () => ({
      data: { id: "row-1" },
      error: null,
    }));
    from.mockImplementation((table: string) => {
      expect(table).toBe("stripe_webhook_events");
      return {
        select: () => ({
          eq: () => ({ maybeSingle }),
        }),
        insert: () => ({
          select: () => ({ maybeSingle: insertMaybe }),
        }),
      };
    });

    await expect(
      claimStripeWebhookEvent(mockSupabase(), {
        stripeEventId: "evt_1",
        eventType: "checkout.session.completed",
        livemode: false,
        payloadHash: "hash",
      }),
    ).resolves.toEqual({ outcome: "claimed", rowId: "row-1" });
  });

  it("negeert reeds verwerkte events", async () => {
    from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { id: "row-1", status: "processed", attempts: 1 },
            error: null,
          }),
        }),
      }),
    }));

    await expect(
      claimStripeWebhookEvent(mockSupabase(), {
        stripeEventId: "evt_1",
        eventType: "checkout.session.completed",
        livemode: false,
        payloadHash: "hash",
      }),
    ).resolves.toEqual({ outcome: "duplicate", status: "processed" });
  });

  it("herstelt failed events als retry", async () => {
    const updateEqStatus = vi.fn(async () => ({ error: null }));
    from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { id: "row-1", status: "failed", attempts: 1 },
            error: null,
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: updateEqStatus,
        }),
      }),
    }));

    await expect(
      claimStripeWebhookEvent(mockSupabase(), {
        stripeEventId: "evt_1",
        eventType: "checkout.session.completed",
        livemode: true,
        payloadHash: "hash2",
      }),
    ).resolves.toEqual({ outcome: "retry", rowId: "row-1", attempts: 2 });
  });

  it("behandelt unique-race als duplicate", async () => {
    from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          maybeSingle: async () => ({
            data: null,
            error: { code: "23505", message: "duplicate key" },
          }),
        }),
      }),
    }));

    await expect(
      claimStripeWebhookEvent(mockSupabase(), {
        stripeEventId: "evt_race",
        eventType: "checkout.session.completed",
        livemode: false,
        payloadHash: "hash",
      }),
    ).resolves.toEqual({ outcome: "duplicate", status: "processing" });
  });

  it("markeert complete en fail", async () => {
    const update = vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null })),
    }));
    from.mockImplementation(() => ({ update }));

    await completeStripeWebhookEvent(mockSupabase(), "row-1");
    await failStripeWebhookEvent(mockSupabase(), "row-1", "boom");
    expect(update).toHaveBeenCalledTimes(2);
  });

  it("scheidt livemode via claim-input (zelfde object-id, ander event-id)", async () => {
    const insertCalls: Array<Record<string, unknown>> = [];
    from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: (payload: Record<string, unknown>) => {
        insertCalls.push(payload);
        return {
          select: () => ({
            maybeSingle: async () => ({
              data: { id: `row-${insertCalls.length}` },
              error: null,
            }),
          }),
        };
      },
    }));

    await claimStripeWebhookEvent(mockSupabase(), {
      stripeEventId: "evt_test",
      eventType: "checkout.session.completed",
      livemode: false,
      payloadHash: "a",
    });
    await claimStripeWebhookEvent(mockSupabase(), {
      stripeEventId: "evt_live",
      eventType: "checkout.session.completed",
      livemode: true,
      payloadHash: "b",
    });

    expect(insertCalls[0]?.livemode).toBe(false);
    expect(insertCalls[1]?.livemode).toBe(true);
  });
});
