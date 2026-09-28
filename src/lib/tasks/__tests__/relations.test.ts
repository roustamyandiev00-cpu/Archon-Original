import { describe, expect, it } from "vitest";
import { assertTaskRelations } from "@/lib/tasks/relations";

type Row = Record<string, unknown>;

function makeClient(rowsByTable: Record<string, Row[]>) {
  let table: string | null = null;
  const eq: Array<[string, unknown]> = [];
  const is: Array<[string, unknown]> = [];

  const chain = {
    from(name: string) {
      table = name;
      return chain;
    },
    select() {
      return chain;
    },
    eq(column: string, value: unknown) {
      eq.push([column, value]);
      return chain;
    },
    is(column: string, value: unknown) {
      is.push([column, value]);
      return chain;
    },
    async maybeSingle() {
      const rows = (rowsByTable[table ?? ""] ?? []).filter(
        (row) =>
          eq.every(([c, v]) => row[c] === v) &&
          is.every(([c, v]) => (v === null ? row[c] === null : row[c] === v)),
      );
      return { data: rows[0] ?? null, error: null };
    },
  };

  return chain as unknown as Parameters<typeof assertTaskRelations>[0];
}

describe("assertTaskRelations — cross-tenant validatie", () => {
  it("accepteert een deal van dezelfde tenant", async () => {
    const supabase = makeClient({
      deals: [{ id: 123, bedrijf_id: 10 }],
    });

    const result = await assertTaskRelations(supabase, 10, { dealId: 123 });
    expect(result).toEqual({ ok: true });
  });

  it("weigert een deal van een andere tenant", async () => {
    const supabase = makeClient({
      deals: [{ id: 123, bedrijf_id: 99 }],
    });

    const result = await assertTaskRelations(supabase, 10, { dealId: 123 });
    expect(result).toEqual({ ok: false, error: "Deal behoort niet tot dit bedrijf." });
  });

  it("weigert een niet-bestaande deal", async () => {
    const supabase = makeClient({ deals: [] });

    const result = await assertTaskRelations(supabase, 10, { dealId: 404 });
    expect(result).toEqual({ ok: false, error: "Deal behoort niet tot dit bedrijf." });
  });

  it("weigert een contact van een andere tenant", async () => {
    const supabase = makeClient({
      customers: [{ id: 5, company_id: 99 }],
    });

    const result = await assertTaskRelations(supabase, 10, { contactId: 5 });
    expect(result).toEqual({
      ok: false,
      error: "Contact behoort niet tot dit bedrijf.",
    });
  });
});
