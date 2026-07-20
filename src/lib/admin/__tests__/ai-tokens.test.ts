import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { grantCompanyTokens } from "@/lib/admin/ai-tokens";

describe("grantCompanyTokens", () => {
  it("gebruikt de atomische CEO RPC met actor en idempotency key", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          transaction_id: "82c0dc30-ea8d-4bb0-84c0-802ad62df404",
          credits_before: 1_000,
          credits_after: 1_500,
          applied: true,
        },
      ],
      error: null,
    });
    const supabase = { rpc } as unknown as SupabaseClient<Database>;

    await expect(
      grantCompanyTokens(
        supabase,
        12,
        500,
        "4f27d6a5-dc14-4c23-9af4-cd4056740a89",
        "d95c9e88-c21a-4b25-b43b-76d539980aac",
        "Handmatige correctie",
      ),
    ).resolves.toEqual({
      ok: true,
      applied: true,
      transactionId: "82c0dc30-ea8d-4bb0-84c0-802ad62df404",
      creditsBefore: 1_000,
      creditsAfter: 1_500,
    });

    expect(rpc).toHaveBeenCalledWith("ceo_grant_ai_credits", {
      p_company_id: 12,
      p_tokens: 500,
      p_actor_user_id: "4f27d6a5-dc14-4c23-9af4-cd4056740a89",
      p_idempotency_key: "d95c9e88-c21a-4b25-b43b-76d539980aac",
      p_note: "Handmatige correctie",
    });
  });

  it("faalt gesloten bij een databasefout of ontbrekend auditresultaat", async () => {
    const databaseError = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "audit insert failed" },
      }),
    } as unknown as SupabaseClient<Database>;
    const emptyResult = {
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as unknown as SupabaseClient<Database>;

    await expect(
      grantCompanyTokens(databaseError, 12, 500, "actor", "key"),
    ).resolves.toEqual({ ok: false, error: "audit insert failed" });
    await expect(
      grantCompanyTokens(emptyResult, 12, 500, "actor", "key"),
    ).resolves.toEqual({
      ok: false,
      error: "AI credit grant returned no audit record",
    });
  });
});
