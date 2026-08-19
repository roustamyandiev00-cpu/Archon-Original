import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireWriteAccess, loadCompanyDefaultTemplate } = vi.hoisted(() => ({
  requireWriteAccess: vi.fn(),
  loadCompanyDefaultTemplate: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/components/dashboard/context", () => ({ requireWriteAccess }));
vi.mock("@/components/dashboard/documenten/documentTemplate", () => ({
  loadCompanyDefaultTemplate,
}));
vi.mock("@/components/dashboard/integraties/slackNotify", () => ({
  notifySlackNewFactuur: vi.fn(),
}));
vi.mock("@/lib/agents/events/payment-received", () => ({
  notifyPaymentReceived: vi.fn(),
}));

import { createFactuur } from "@/app/dashboard/facturen/actions";

const validInput = () => ({
  documentType: "factuur" as const,
  customerId: null,
  projectId: null,
  klant: "Voorbeeld BV",
  datum: "2026-07-18",
  vervaldatum: "2026-08-01",
  omschrijving: "",
  notities: "",
  lines: [
    {
      omschrijving: "Werkuren",
      aantal: 2,
      eenheid: "uur",
      prijs_per_eenheid: 50,
      btw_percentage: 21,
    },
  ],
});

function lookupClient(results: Record<string, { data: unknown; error: unknown }>) {
  const insert = vi.fn();
  const from = vi.fn((table: string) => {
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => results[table] ?? { data: null, error: null }),
      insert,
    };
    return chain;
  });
  return { client: { from }, from, insert };
}

beforeEach(() => {
  vi.clearAllMocks();
  loadCompanyDefaultTemplate.mockResolvedValue("classic");
});

describe("createFactuur validatie voor writes", () => {
  it("weigert een cross-tenant customerId vóór de factuurinsert", async () => {
    const db = lookupClient({ customers: { data: null, error: null } });
    requireWriteAccess.mockResolvedValue({
      supabase: db.client,
      user: { id: "user-1" },
      companyId: 7,
    });

    const result = await createFactuur({ ...validInput(), customerId: 99 });

    expect(result).toEqual({
      error: "De gekozen klant behoort niet tot dit bedrijf.",
    });
    expect(db.from).not.toHaveBeenCalledWith("facturen");
  });

  it("weigert een cross-tenant projectId vóór de factuurinsert", async () => {
    const db = lookupClient({ projecten: { data: null, error: null } });
    requireWriteAccess.mockResolvedValue({
      supabase: db.client,
      user: { id: "user-1" },
      companyId: 7,
    });

    const result = await createFactuur({ ...validInput(), projectId: "other" });

    expect(result).toEqual({
      error: "Het gekozen project behoort niet tot dit bedrijf.",
    });
    expect(db.from).not.toHaveBeenCalledWith("facturen");
  });

  it("doet geen eerste query of insert wanneer invoervalidatie faalt", async () => {
    const db = lookupClient({});
    requireWriteAccess.mockResolvedValue({
      supabase: db.client,
      user: { id: "user-1" },
      companyId: 7,
    });

    const result = await createFactuur({ ...validInput(), lines: [] });

    expect(result).toEqual({ error: "Voeg minstens één factuurlijn toe." });
    expect(db.from).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
});
