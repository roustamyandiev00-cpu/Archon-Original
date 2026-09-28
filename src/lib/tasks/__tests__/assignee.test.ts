import { describe, expect, it } from "vitest";
import { assertAssigneeMembership } from "@/lib/tasks/relations";

const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";

type Member = { user_id: string; is_active: boolean };

function makeClient(members: Member[] = []) {
  return {
    rpc: async () => ({ data: members, error: null }),
  } as unknown as Parameters<typeof assertAssigneeMembership>[0];
}

describe("assertAssigneeMembership", () => {
  it("staat een actief lid van hetzelfde bedrijf toe", async () => {
    const supabase = makeClient([{ user_id: ALICE, is_active: true }]);
    const result = await assertAssigneeMembership(supabase, 10, ALICE);
    expect(result).toEqual({ ok: true, userId: ALICE });
  });

  it("weigert een gebruiker uit een ander bedrijf", async () => {
    // BOB is lid van een ander bedrijf en staat daarom niet in de ledenlijst
    // van bedrijf 10.
    const supabase = makeClient([{ user_id: ALICE, is_active: true }]);
    const result = await assertAssigneeMembership(supabase, 10, BOB);
    expect(result).toEqual({
      ok: false,
      error: "Gebruiker is geen actief lid van dit bedrijf.",
    });
  });

  it("weigert een gebruiker zonder membership", async () => {
    const supabase = makeClient([]);
    const result = await assertAssigneeMembership(supabase, 10, ALICE);
    expect(result).toEqual({
      ok: false,
      error: "Gebruiker is geen actief lid van dit bedrijf.",
    });
  });

  it("weigert een ongeldige userId", async () => {
    const supabase = makeClient([{ user_id: ALICE, is_active: true }]);
    const result = await assertAssigneeMembership(supabase, 10, "niet-een-uuid");
    expect(result).toEqual({ ok: false, error: "Ongeldige gebruiker." });
  });

  it("weigert een inactive membership", async () => {
    const supabase = makeClient([{ user_id: ALICE, is_active: false }]);
    const result = await assertAssigneeMembership(supabase, 10, ALICE);
    expect(result).toEqual({
      ok: false,
      error: "Gebruiker is geen actief lid van dit bedrijf.",
    });
  });

  it("staat unassign (null) toe", async () => {
    const supabase = makeClient([]);
    const result = await assertAssigneeMembership(supabase, 10, null);
    expect(result).toEqual({ ok: true, userId: null });
  });
});
