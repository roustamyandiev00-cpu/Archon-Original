import { beforeEach, describe, expect, it, vi } from "vitest";

const { grantCompanyTokens, revalidatePath, requirePlatformAdmin } = vi.hoisted(() => ({
  grantCompanyTokens: vi.fn(),
  revalidatePath: vi.fn(),
  requirePlatformAdmin: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/platform-admin", () => ({ requirePlatformAdmin }));
vi.mock("@/lib/integraties", () => ({ untyped: (value: unknown) => value }));
vi.mock("@/lib/admin/ai-tokens", () => ({ grantCompanyTokens }));

import {
  addAiCreditsAction,
  updateCompanyStatusAction,
} from "@/app/admin/actions";

type CompanyRow = {
  id: number;
  naam: string;
  status: string;
  is_active: boolean;
  subscription_status: string | null;
};

function createServiceClient(options?: {
  company?: CompanyRow | null;
  auditRequestFails?: boolean;
  updateFails?: boolean;
}) {
  const company = options?.company ?? {
    id: 42,
    naam: "Testbedrijf",
    status: "active",
    is_active: true,
    subscription_status: "active",
  };
  const auditInserts: Array<Record<string, unknown>> = [];
  const updates: Array<Record<string, unknown>> = [];

  const from = vi.fn((table: string) => {
    if (table === "audit_logs") {
      return {
        insert: vi.fn(async (value: Record<string, unknown>) => {
          auditInserts.push(value);
          return {
            error:
              options?.auditRequestFails && auditInserts.length === 1
                ? { message: "audit unavailable" }
                : null,
          };
        }),
      };
    }

    if (table !== "bedrijven") throw new Error(`Onverwachte tabel: ${table}`);

    const readQuery = {
      eq: vi.fn(() => readQuery),
      maybeSingle: vi.fn(async () => ({ data: company, error: null })),
    };
    const updateQuery = {
      eq: vi.fn(() => updateQuery),
      select: vi.fn(() => updateQuery),
      maybeSingle: vi.fn(async () => ({
        data: options?.updateFails ? null : { id: company?.id ?? 42 },
        error: options?.updateFails ? { message: "conflict" } : null,
      })),
    };

    return {
      select: vi.fn(() => readQuery),
      update: vi.fn((value: Record<string, unknown>) => {
        updates.push(value);
        return updateQuery;
      }),
    };
  });

  return { serviceSupabase: { from }, auditInserts, updates };
}

describe("updateCompanyStatusAction", () => {
  beforeEach(() => {
    grantCompanyTokens.mockReset();
    revalidatePath.mockReset();
    requirePlatformAdmin.mockReset();
  });

  it("weigert een ongeldig bedrijfsnummer voordat data wordt gelezen", async () => {
    const service = createServiceClient();
    requirePlatformAdmin.mockResolvedValue({
      user: { id: "admin-1" },
      serviceSupabase: service.serviceSupabase,
    });

    await expect(
      updateCompanyStatusAction({ companyId: 0, status: "suspended" }),
    ).resolves.toEqual({ ok: false, error: "Ongeldig bedrijf." });
    expect(service.serviceSupabase.from).not.toHaveBeenCalled();
  });

  it("wijzigt niets wanneer de voorafgaande auditregistratie faalt", async () => {
    const service = createServiceClient({ auditRequestFails: true });
    requirePlatformAdmin.mockResolvedValue({
      user: { id: "admin-1" },
      serviceSupabase: service.serviceSupabase,
    });

    const result = await updateCompanyStatusAction({
      companyId: 42,
      status: "suspended",
    });

    expect(result.ok).toBe(false);
    expect(service.updates).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("schort toegang op zonder de Stripe-abonnementsstatus te wijzigen", async () => {
    const service = createServiceClient();
    requirePlatformAdmin.mockResolvedValue({
      user: { id: "admin-1" },
      serviceSupabase: service.serviceSupabase,
    });

    await expect(
      updateCompanyStatusAction({ companyId: 42, status: "suspended" }),
    ).resolves.toMatchObject({ ok: true, status: "suspended" });

    expect(service.updates).toHaveLength(1);
    expect(service.updates[0]).toMatchObject({
      is_active: false,
      status: "suspended",
    });
    expect(service.updates[0]).not.toHaveProperty("subscription_status");
    expect(service.auditInserts).toHaveLength(2);
  });

  it("herstelt een proefaccount als proefperiode en niet als betaald account", async () => {
    const service = createServiceClient({
      company: {
        id: 42,
        naam: "Proefbedrijf",
        status: "suspended",
        is_active: false,
        subscription_status: "trialing",
      },
    });
    requirePlatformAdmin.mockResolvedValue({
      user: { id: "admin-1" },
      serviceSupabase: service.serviceSupabase,
    });

    await expect(
      updateCompanyStatusAction({ companyId: 42, status: "active" }),
    ).resolves.toMatchObject({ ok: true, status: "trial" });
    expect(service.updates[0]).toMatchObject({ is_active: true, status: "trial" });
  });
});

describe("addAiCreditsAction", () => {
  beforeEach(() => {
    grantCompanyTokens.mockReset();
    revalidatePath.mockReset();
    requirePlatformAdmin.mockReset();
    requirePlatformAdmin.mockResolvedValue({
      user: { id: "admin-1" },
      serviceSupabase: { from: vi.fn() },
    });
  });

  it("weigert negatieve en onbegrensde credits vóór een mutatie", async () => {
    await expect(
      addAiCreditsAction({ companyId: 42, amount: -1 }),
    ).resolves.toEqual({
      ok: false,
      error: "AI-credits moeten tussen 1 en 10.000.000 liggen.",
    });
    expect(grantCompanyTokens).not.toHaveBeenCalled();
  });

  it("delegeert naar de atomische, actor-gekoppelde grant", async () => {
    grantCompanyTokens.mockResolvedValue({
      ok: true,
      applied: true,
      transactionId: "transaction-1",
      creditsBefore: 100,
      creditsAfter: 600,
    });

    await expect(
      addAiCreditsAction({
        companyId: 42,
        amount: 500,
        idempotencyKey: "d95c9e88-c21a-4b25-b43b-76d539980aac",
        note: " Correctie ",
      }),
    ).resolves.toMatchObject({
      ok: true,
      applied: true,
      creditsBefore: 100,
      creditsAfter: 600,
    });
    expect(grantCompanyTokens).toHaveBeenCalledWith(
      expect.anything(),
      42,
      500,
      "admin-1",
      "d95c9e88-c21a-4b25-b43b-76d539980aac",
      "Correctie",
    );
  });
});
