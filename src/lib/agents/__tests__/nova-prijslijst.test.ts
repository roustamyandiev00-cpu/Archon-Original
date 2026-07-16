import { describe, expect, it } from "vitest";
import {
  enrichLinesWithPrijslijst,
  parseSquareMeters,
} from "@/lib/agents/nova";
import type { PrijslijstPickItem } from "@/components/dashboard/prijslijst/types";

describe("parseSquareMeters", () => {
  it("parses m² and m2", () => {
    expect(parseSquareMeters("45 m²")).toBe(45);
    expect(parseSquareMeters("12,5 m2")).toBe(12.5);
    expect(parseSquareMeters("Afmetingen: 30 vierkante meter")).toBe(30);
  });

  it("parses L × B in meters", () => {
    expect(parseSquareMeters("6 x 4 m")).toBe(24);
    expect(parseSquareMeters("3,5 × 2 m")).toBe(7);
  });

  it("returns null when missing", () => {
    expect(parseSquareMeters("")).toBeNull();
    expect(parseSquareMeters("geen maten")).toBeNull();
  });
});

describe("enrichLinesWithPrijslijst", () => {
  const prijslijst: PrijslijstPickItem[] = [
    {
      id: 1,
      omschrijving: "Pleisterwerk binnen",
      eenheid: "m²",
      prijs: 28,
      btwPercentage: 21,
      categorie: "afwerking",
    },
    {
      id: 2,
      omschrijving: "Werfopruiming",
      eenheid: "forfait",
      prijs: 150,
      btwPercentage: 21,
      categorie: null,
    },
  ];

  it("matches prijslijst and applies m² quantity", () => {
    const lines = enrichLinesWithPrijslijst(
      [
        {
          omschrijving: "Pleisterwerk binnen muren",
          aantal: 1,
          eenheid: "m²",
          prijs_per_eenheid: 0,
          btw_percentage: 21,
        },
      ],
      prijslijst,
      42,
      21,
    );

    expect(lines[0]?.aantal).toBe(42);
    expect(lines[0]?.prijs_per_eenheid).toBe(28);
  });
});
