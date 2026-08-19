import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireWriteAccess: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/components/dashboard/context", () => ({
  requireWriteAccess: mocks.requireWriteAccess,
}));

import {
  createPrijslijstItem,
  setPrijslijstItemActive,
  updatePrijslijstItem,
} from "@/app/dashboard/prijslijst/actions";

const validInput = () => ({
  omschrijving: "Plaatsen gipskarton",
  eenheid: "m²",
  prijs: 42.5,
  btwPercentage: 21,
  categorie: "Afwerking",
});

function createClient(result: {
  data: { id: number } | null;
  error: { message: string } | null;
}) {
  const single = vi.fn(async () => result);
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ insert }));
  return { client: { from }, from, insert, select, single };
}

function updateClient(result: {
  data: { id: number } | null;
  error: { message: string } | null;
}) {
  const maybeSingle = vi.fn(async () => result);
  const chain = {
    eq: vi.fn(() => chain),
    select: vi.fn(() => ({ maybeSingle })),
  };
  const update = vi.fn(() => chain);
  const from = vi.fn(() => ({ update }));
  return { client: { from }, from, update, chain, maybeSingle };
}

function grantAccess(client: unknown) {
  mocks.requireWriteAccess.mockResolvedValue({
    supabase: client,
    companyId: 7,
    user: { id: "user-1" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Prijslijst servervalidatie", () => {
  it("stopt vóór een databasequery wanneer schrijftoegang ontbreekt", async () => {
    mocks.requireWriteAccess.mockResolvedValue({ error: "Geen actief bedrijf gevonden." });

    await expect(createPrijslijstItem(validInput())).resolves.toEqual({
      error: "Geen actief bedrijf gevonden.",
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "weigert een niet-finite prijs: %s",
    async (prijs) => {
      const db = createClient({ data: { id: 1 }, error: null });
      grantAccess(db.client);

      await expect(createPrijslijstItem({ ...validInput(), prijs })).resolves.toEqual({
        error: "Prijs moet een geldig getal zijn.",
      });
      expect(db.from).not.toHaveBeenCalled();
    },
  );

  it("weigert negatieve en tekstuele prijzen vóór de databasequery", async () => {
    const db = createClient({ data: { id: 1 }, error: null });
    grantAccess(db.client);

    await expect(createPrijslijstItem({ ...validInput(), prijs: -1 })).resolves.toEqual({
      error: "Prijs mag niet negatief zijn.",
    });
    await expect(
      createPrijslijstItem({
        ...validInput(),
        prijs: "42.50" as unknown as number,
      }),
    ).resolves.toEqual({ error: "Prijs moet een geldig getal zijn." });
    expect(db.from).not.toHaveBeenCalled();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, 101])(
    "weigert een ongeldig btw-percentage: %s",
    async (btwPercentage) => {
      const db = createClient({ data: { id: 1 }, error: null });
      grantAccess(db.client);

      const result = await createPrijslijstItem({ ...validInput(), btwPercentage });

      expect(result).toHaveProperty("error");
      expect(db.from).not.toHaveBeenCalled();
    },
  );

  it("weigert een te lange eenheid in plaats van die stilzwijgend af te kappen", async () => {
    const db = createClient({ data: { id: 1 }, error: null });
    grantAccess(db.client);

    await expect(
      createPrijslijstItem({ ...validInput(), eenheid: "x".repeat(41) }),
    ).resolves.toEqual({ error: "Eenheid mag maximaal 40 tekens bevatten." });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("gebruikt uitsluitend de server-side tenant en gebruiker bij aanmaken", async () => {
    const db = createClient({ data: { id: 12 }, error: null });
    grantAccess(db.client);

    await expect(
      createPrijslijstItem({
        ...validInput(),
        omschrijving: "  Plaatsen gipskarton  ",
        categorie: "  Afwerking  ",
      }),
    ).resolves.toEqual({ ok: true, id: 12 });

    expect(db.from).toHaveBeenCalledWith("prijslijst_items");
    expect(db.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: 7,
        created_by: "user-1",
        omschrijving: "Plaatsen gipskarton",
        categorie: "Afwerking",
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/prijslijst");
  });

  it("geeft geen ruwe databasefout terug", async () => {
    const db = createClient({ data: null, error: { message: "internal relation detail" } });
    grantAccess(db.client);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await createPrijslijstItem(validInput());

    expect(result).toEqual({
      error: "De prijslijst kon niet worden opgeslagen. Probeer het opnieuw.",
    });
    expect(JSON.stringify(result)).not.toContain("internal relation detail");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("Prijslijst tenantgebonden updates", () => {
  it("weigert een ongeldig artikelnummer vóór de databasequery", async () => {
    const db = updateClient({ data: { id: 1 }, error: null });
    grantAccess(db.client);

    await expect(updatePrijslijstItem(Number.NaN, validInput())).resolves.toEqual({
      error: "Ongeldig artikelnummer.",
    });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("filtert een update op artikel én server-side tenant", async () => {
    const db = updateClient({ data: { id: 9 }, error: null });
    grantAccess(db.client);

    await expect(updatePrijslijstItem(9, validInput())).resolves.toEqual({ ok: true });

    expect(db.chain.eq).toHaveBeenNthCalledWith(1, "id", 9);
    expect(db.chain.eq).toHaveBeenNthCalledWith(2, "company_id", 7);
    expect(db.chain.select).toHaveBeenCalledWith("id");
  });

  it("rapporteert nul gewijzigde rijen niet als succes", async () => {
    const db = updateClient({ data: null, error: null });
    grantAccess(db.client);

    await expect(updatePrijslijstItem(9, validInput())).resolves.toEqual({
      error: "Artikel niet gevonden of geen toegang.",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("weigert een niet-booleaanse status vóór de databasequery", async () => {
    const db = updateClient({ data: { id: 9 }, error: null });
    grantAccess(db.client);

    await expect(
      setPrijslijstItemActive(9, "true" as unknown as boolean),
    ).resolves.toEqual({ error: "Ongeldige artikelstatus." });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("filtert een statuswijziging op artikel én server-side tenant", async () => {
    const db = updateClient({ data: { id: 9 }, error: null });
    grantAccess(db.client);

    await expect(setPrijslijstItemActive(9, false)).resolves.toEqual({ ok: true });

    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false }),
    );
    expect(db.chain.eq).toHaveBeenNthCalledWith(1, "id", 9);
    expect(db.chain.eq).toHaveBeenNthCalledWith(2, "company_id", 7);
  });
});
