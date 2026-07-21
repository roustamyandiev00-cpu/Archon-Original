import { describe, expect, it } from "vitest";
import {
  describeTokenUsageLoadError,
  getTokenUsageSummary,
} from "@/lib/admin/ai-tokens";

describe("AI-tokenbeheer", () => {
  it("blokkeert tokenbeheer wanneer token_limit in het schema ontbreekt", () => {
    expect(
      describeTokenUsageLoadError(
        "credits",
        "column company_ai_credits.token_limit does not exist",
      ),
    ).toContain("tijdelijk geblokkeerd");
  });

  it("berekent alleen samenvattingen uit aangeleverde creditgegevens", () => {
    const summary = getTokenUsageSummary([
      {
        companyId: 1,
        companyName: "Testbedrijf",
        ownerEmail: null,
        creditsRemaining: 25,
        creditsUsed: 75,
        totalPurchased: 100,
        totalSpent: 4,
        lowBalanceThreshold: 50,
        tokenLimit: null,
        isTrialUser: true,
        trialExpiresAt: null,
        lastActivity: null,
        createdAt: null,
      },
    ]);

    expect(summary).toEqual({
      totalCompanies: 1,
      totalCreditsUsed: 75,
      totalSpent: 4,
      averagePerCompany: 75,
      lowBalanceCount: 1,
      trialUsersCount: 1,
    });
  });
});
