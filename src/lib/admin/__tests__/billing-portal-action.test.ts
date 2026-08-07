import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePlatformAdmin: vi.fn(),
  customerRetrieve: vi.fn(),
  portalCreate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/platform-admin", () => ({
  requirePlatformAdmin: mocks.requirePlatformAdmin,
}));
vi.mock("@/lib/stripe", () => ({
  getAppOrigin: () => "https://app.archonpro.test",
  isStripeConfigured: () => true,
  getStripe: () => ({
    customers: { retrieve: mocks.customerRetrieve },
    billingPortal: { sessions: { create: mocks.portalCreate } },
  }),
}));
vi.mock("@/lib/integraties", () => ({ untyped: (value: unknown) => value }));

import { createStripeBillingPortalAction } from "@/app/admin/actions";

function createServiceClient(options?: {
  companyExists?: boolean;
  customerId?: string | null;
  auditRequestFails?: boolean;
  auditResultFails?: boolean;
}) {
  const auditInserts: Array<Record<string, unknown>> = [];
  const from = vi.fn((table: string) => {
    if (table === "audit_logs") {
      return {
        insert: vi.fn(async (value: Record<string, unknown>) => {
          auditInserts.push(value);
          const requestFailed =
            options?.auditRequestFails && auditInserts.length === 1;
          const resultFailed =
            options?.auditResultFails && auditInserts.length === 2;
          return {
            error:
              requestFailed || resultFailed
                ? { message: "audit unavailable" }
                : null,
          };
        }),
      };
    }

    const query = {
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => {
        if (table === "bedrijven") {
          return {
            data: options?.companyExists === false ? null : { id: 42, naam: "Testbedrijf" },
            error: null,
          };
        }
        if (table === "company_ai_credits") {
          return {
            data: { stripe_customer_id: options?.customerId ?? "cus_test42" },
            error: null,
          };
        }
        throw new Error(`Onverwachte tabel: ${table}`);
      }),
    };
    return { select: vi.fn(() => query) };
  });

  return { serviceSupabase: { from }, auditInserts };
}

describe("createStripeBillingPortalAction", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.customerRetrieve.mockResolvedValue({
      id: "cus_test42",
      deleted: false,
      metadata: { companyId: "42" },
    });
    mocks.portalCreate.mockResolvedValue({
      id: "bps_test42",
      url: "https://billing.stripe.com/p/session/test42",
    });
  });

  it("weigert een ongeldig bedrijfsnummer voordat Stripe wordt benaderd", async () => {
    const service = createServiceClient();
    mocks.requirePlatformAdmin.mockResolvedValue({
      user: { id: "admin-1" },
      serviceSupabase: service.serviceSupabase,
    });

    await expect(createStripeBillingPortalAction({ companyId: 0 })).resolves.toEqual({
      ok: false,
      error: "Ongeldig bedrijf.",
    });
    expect(mocks.customerRetrieve).not.toHaveBeenCalled();
    expect(service.serviceSupabase.from).not.toHaveBeenCalled();
  });

  it("weigert een Stripe-klant die aan een ander bedrijf gekoppeld is", async () => {
    const service = createServiceClient();
    mocks.requirePlatformAdmin.mockResolvedValue({
      user: { id: "admin-1" },
      serviceSupabase: service.serviceSupabase,
    });
    mocks.customerRetrieve.mockResolvedValue({
      id: "cus_test42",
      deleted: false,
      metadata: { companyId: "99" },
    });

    const result = await createStripeBillingPortalAction({ companyId: 42 });
    expect(result).toEqual({
      ok: false,
      error: "De Stripe-klant hoort niet bij het geselecteerde bedrijf.",
    });
    expect(mocks.portalCreate).not.toHaveBeenCalled();
  });

  it("maakt geen portalsessie wanneer de voorafgaande audit faalt", async () => {
    const service = createServiceClient({ auditRequestFails: true });
    mocks.requirePlatformAdmin.mockResolvedValue({
      user: { id: "admin-1" },
      serviceSupabase: service.serviceSupabase,
    });

    const result = await createStripeBillingPortalAction({ companyId: 42 });
    expect(result.ok).toBe(false);
    expect(mocks.portalCreate).not.toHaveBeenCalled();
  });

  it("maakt een geaudite portalsessie voor exact de gekoppelde Stripe-klant", async () => {
    const service = createServiceClient();
    mocks.requirePlatformAdmin.mockResolvedValue({
      user: { id: "admin-1" },
      serviceSupabase: service.serviceSupabase,
    });

    await expect(
      createStripeBillingPortalAction({ companyId: 42 }),
    ).resolves.toEqual({
      ok: true,
      url: "https://billing.stripe.com/p/session/test42",
    });
    expect(mocks.customerRetrieve).toHaveBeenCalledWith("cus_test42");
    expect(mocks.portalCreate).toHaveBeenCalledWith({
      customer: "cus_test42",
      return_url: "https://app.archonpro.test/admin/companies/42",
    });
    expect(service.auditInserts).toHaveLength(2);
    expect(service.auditInserts).toEqual([
      expect.objectContaining({ severity: "warn" }),
      expect.objectContaining({ severity: "warn" }),
    ]);
  });

  it("geeft de portalsessie niet vrij wanneer de afrondende audit faalt", async () => {
    const service = createServiceClient({ auditResultFails: true });
    mocks.requirePlatformAdmin.mockResolvedValue({
      user: { id: "admin-1" },
      serviceSupabase: service.serviceSupabase,
    });

    const result = await createStripeBillingPortalAction({ companyId: 42 });
    expect(result).toEqual({
      ok: false,
      error: "De Stripe-sessie is niet vrijgegeven omdat de audit niet compleet is.",
    });
  });
});
