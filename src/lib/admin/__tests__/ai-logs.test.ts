import { describe, expect, it } from "vitest";
import {
  parseAiLogFilters,
  redactLogText,
} from "@/lib/admin/ai-logs";

describe("parseAiLogFilters", () => {
  it("accepteert alleen geldige, begrensde filters", () => {
    expect(
      parseAiLogFilters({
        company: "42",
        agent: `  ${"a".repeat(100)}  `,
        status: "error",
        period: "24h",
      }),
    ).toEqual({
      companyId: 42,
      agent: "a".repeat(80),
      status: "error",
      period: "24h",
    });
  });

  it("valt veilig terug bij ongeldige URL-waarden", () => {
    expect(
      parseAiLogFilters({
        company: "-1",
        status: "onbekend",
        period: "morgen",
      }),
    ).toEqual({
      companyId: null,
      agent: null,
      status: "all",
      period: "7d",
    });
  });
});

describe("redactLogText", () => {
  it("verbergt courante API-secrets vóór ze naar de browser gaan", () => {
    expect(
      redactLogText(
        "Authorization: Bearer abc.def-123 api_key=supersecret sk-examplekey123456789",
      ),
    ).toBe(
      "Authorization: Bearer [verborgen] api_key=[verborgen] [verborgen]",
    );
  });

  it("normaliseert en begrenst lange logregels", () => {
    const result = redactLogText(`  fout\n\t${"x".repeat(400)}  `);

    expect(result).toHaveLength(318);
    expect(result).toMatch(/^fout x+/);
    expect(result).toMatch(/…$/);
  });
});
