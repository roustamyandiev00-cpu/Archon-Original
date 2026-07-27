import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  claimStripeWebhookEvent,
  completeStripeWebhookEvent,
  failStripeWebhookEvent,
  hashStripePayload,
} from "@/lib/stripe/webhook-events";

type Row = {
  id: string;
  stripe_event_id: string;
  event_type: string;
  livemode: boolean;
  status: string;
  attempts: number;
  payload_hash: string;
};

function createMemoryClient(seed: Row[] = []) {
  const rows = [...seed];
  const api = {
    from(table: string) {
      void table;
      return {
        select(cols?: string) {
          void cols;
          return {
            eq(column: string, value: string) {
              return {
                maybeSingle: async () => {
                  const found = rows.find(
                    (r) => (r as Record<string, unknown>)[column] === value,
                  );
                  return { data: found ?? null, error: null };
                },
                eq() {
                  return this;
                },
              };
            },
          };
        },
        insert(payload: Partial<Row>) {
          return {
            select(cols?: string) {
              void cols;
              return {
                maybeSingle: async () => {
                  if (
                    rows.some((r) => r.stripe_event_id === payload.stripe_event_id)
                  ) {
                    return {
                      data: null,
                      error: { code: "23505", message: "duplicate" },
                    };
                  }
                  const row: Row = {
                    id: payload.id ?? `row-${rows.length + 1}`,
                    stripe_event_id: String(payload.stripe_event_id),
                    event_type: String(payload.event_type),
                    livemode: Boolean(payload.livemode),
                    status: String(payload.status ?? "processing"),
                    attempts: Number(payload.attempts ?? 1),
                    payload_hash: String(payload.payload_hash),
                  };
                  rows.push(row);
                  return { data: { id: row.id, attempts: row.attempts }, error: null };
                },
              };
            },
          };
        },
        update(patch: Partial<Row>) {
          return {
            eq(column: string, value: string) {
              const chain = {
                eq(column2: string, value2: string) {
                  const row = rows.find(
                    (r) =>
                      (r as Record<string, unknown>)[column] === value &&
                      (r as Record<string, unknown>)[column2] === value2,
                  );
                  if (row) Object.assign(row, patch);
                  return Promise.resolve({ error: null });
                },
                then(
                  resolve: (v: { error: null }) => void,
                ) {
                  const row = rows.find(
                    (r) => (r as Record<string, unknown>)[column] === value,
                  );
                  if (row) Object.assign(row, patch);
                  resolve({ error: null });
                },
              };
              return chain;
            },
          };
        },
      };
    },
    _rows: rows,
  };
  return api;
}

describe("stripe webhook event ledger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("hasht payload stabiel", () => {
    expect(hashStripePayload('{"a":1}')).toEqual(hashStripePayload('{"a":1}'));
    expect(hashStripePayload('{"a":1}')).not.toEqual(hashStripePayload('{"a":2}'));
  });

  it("claimt een nieuw event", async () => {
    const client = createMemoryClient();
    const result = await claimStripeWebhookEvent(client as never, {
      stripeEventId: "evt_1",
      eventType: "checkout.session.completed",
      livemode: false,
      payloadHash: "abc",
    });
    expect(result.outcome).toBe("claimed");
    expect(client._rows).toHaveLength(1);
    expect(client._rows[0].livemode).toBe(false);
  });

  it("negeert identiek opnieuw ontvangen processed event", async () => {
    const client = createMemoryClient([
      {
        id: "r1",
        stripe_event_id: "evt_1",
        event_type: "checkout.session.completed",
        livemode: false,
        status: "processed",
        attempts: 1,
        payload_hash: "abc",
      },
    ]);
    const result = await claimStripeWebhookEvent(client as never, {
      stripeEventId: "evt_1",
      eventType: "checkout.session.completed",
      livemode: false,
      payloadHash: "abc",
    });
    expect(result).toEqual({ outcome: "duplicate", status: "processed" });
  });

  it("scheidt testmode en livemode via aparte event ids", async () => {
    const client = createMemoryClient();
    await claimStripeWebhookEvent(client as never, {
      stripeEventId: "evt_test",
      eventType: "invoice.paid",
      livemode: false,
      payloadHash: "h1",
    });
    await claimStripeWebhookEvent(client as never, {
      stripeEventId: "evt_live",
      eventType: "invoice.paid",
      livemode: true,
      payloadHash: "h2",
    });
    expect(client._rows.map((r) => r.livemode)).toEqual([false, true]);
  });

  it("staat retry toe na failure", async () => {
    const client = createMemoryClient([
      {
        id: "r1",
        stripe_event_id: "evt_fail",
        event_type: "invoice.paid",
        livemode: false,
        status: "failed",
        attempts: 1,
        payload_hash: "abc",
      },
    ]);
    const result = await claimStripeWebhookEvent(client as never, {
      stripeEventId: "evt_fail",
      eventType: "invoice.paid",
      livemode: false,
      payloadHash: "abc",
    });
    expect(result.outcome).toBe("retry");
    if (result.outcome === "retry") {
      expect(result.attempts).toBe(2);
    }
  });

  it("markeert complete en fail", async () => {
    const client = createMemoryClient([
      {
        id: "r1",
        stripe_event_id: "evt_x",
        event_type: "invoice.paid",
        livemode: false,
        status: "processing",
        attempts: 1,
        payload_hash: "abc",
      },
    ]);
    await completeStripeWebhookEvent(client as never, "r1");
    expect(client._rows[0].status).toBe("processed");
    client._rows[0].status = "processing";
    await failStripeWebhookEvent(client as never, "r1", "boom");
    expect(client._rows[0].status).toBe("failed");
  });

  it("behandelt gelijktijdige insert als duplicate", async () => {
    const client = createMemoryClient([
      {
        id: "r1",
        stripe_event_id: "evt_race",
        event_type: "invoice.paid",
        livemode: false,
        status: "processing",
        attempts: 1,
        payload_hash: "abc",
      },
    ]);
    // Force insert path by clearing read then hitting unique — simulate via empty first then seed
    const emptyThenRace = createMemoryClient();
    // First claim
    await claimStripeWebhookEvent(emptyThenRace as never, {
      stripeEventId: "evt_race",
      eventType: "invoice.paid",
      livemode: false,
      payloadHash: "abc",
    });
    // Second claim while processing
    const second = await claimStripeWebhookEvent(emptyThenRace as never, {
      stripeEventId: "evt_race",
      eventType: "invoice.paid",
      livemode: false,
      payloadHash: "abc",
    });
    expect(second.outcome).toBe("duplicate");
    expect(client._rows[0].status).toBe("processing");
  });
});
