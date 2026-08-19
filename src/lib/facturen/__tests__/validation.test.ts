import { describe, expect, it } from "vitest";
import {
  isAllowedFactuurStatusTransition,
  validateCreateFactuurInput,
} from "@/lib/facturen/validation";

const validInput = () => ({
  documentType: "factuur",
  customerId: 1,
  projectId: "project-1",
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

describe("factuurvalidatie", () => {
  it("weigert een volledig ongeldig actionargument", () => {
    expect(validateCreateFactuurInput(null)).toEqual({
      ok: false,
      error: "Ongeldige factuurgegevens.",
    });
  });

  it("weigert een ongeldig documenttype", () => {
    expect(
      validateCreateFactuurInput({ ...validInput(), documentType: "memo" }),
    ).toEqual({ ok: false, error: "Ongeldig documenttype." });
  });

  it("weigert lege en ongeldige regels", () => {
    expect(validateCreateFactuurInput({ ...validInput(), lines: [] }).ok).toBe(
      false,
    );
    expect(
      validateCreateFactuurInput({
        ...validInput(),
        lines: [{ ...validInput().lines[0], omschrijving: "" }],
      }).ok,
    ).toBe(false);
  });

  it.each([
    ["NaN aantal", { aantal: Number.NaN }],
    ["oneindig aantal", { aantal: Number.POSITIVE_INFINITY }],
    ["negatieve prijs", { prijs_per_eenheid: -1 }],
    ["oneindige prijs", { prijs_per_eenheid: Number.NEGATIVE_INFINITY }],
    ["ongeldige btw", { btw_percentage: 101 }],
  ])("weigert %s", (_label, patch) => {
    const result = validateCreateFactuurInput({
      ...validInput(),
      lines: [{ ...validInput().lines[0], ...patch }],
    });
    expect(result.ok).toBe(false);
  });

  it("berekent totalen uitsluitend server-side uit gevalideerde regels", () => {
    const result = validateCreateFactuurInput(validInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.totals).toEqual({ subtotaal: 100, btw: 21, totaal: 121 });
  });

  it("weigert ongeldige statustransities", () => {
    expect(
      isAllowedFactuurStatusTransition({
        documentType: "factuur",
        currentStatus: "concept",
        nextStatus: "betaald",
      }),
    ).toBe(false);
    expect(
      isAllowedFactuurStatusTransition({
        documentType: "proforma",
        currentStatus: "concept",
        nextStatus: "verzonden",
      }),
    ).toBe(false);
    expect(
      isAllowedFactuurStatusTransition({
        documentType: "memo",
        currentStatus: "concept",
        nextStatus: "verzonden",
      }),
    ).toBe(false);
    expect(
      isAllowedFactuurStatusTransition({
        documentType: "factuur",
        currentStatus: "verzonden",
        nextStatus: "betaald",
      }),
    ).toBe(true);
  });
});
