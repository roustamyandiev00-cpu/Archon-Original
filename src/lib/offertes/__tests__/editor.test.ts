import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type OfferteValidationInput,
  validateOfferteInput,
} from "@/lib/offertes";

const validInput: OfferteValidationInput = {
  klant: "Bouwbedrijf Peeters",
  datum: "2026-07-19",
  geldigTot: "2026-08-18",
  lines: [
    {
      omschrijving: "Plaatsing",
      aantal: 2,
      eenheid: "uur",
      prijs_per_eenheid: 75,
      btw_percentage: 21,
    },
  ],
};

const source = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("offerteditorvalidatie", () => {
  it("accepteert een volledige offerte", () => {
    expect(validateOfferteInput(validInput)).toEqual([]);
  });

  it("vereist klant, geldige datumvolgorde en minstens één volledige lijn", () => {
    const issues = validateOfferteInput({
      klant: " ",
      datum: "2026-07-19",
      geldigTot: "2026-07-18",
      lines: [
        {
          omschrijving: "",
          aantal: 1,
          eenheid: "stuks",
          prijs_per_eenheid: 0,
          btw_percentage: 21,
        },
      ],
    });

    expect(issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(["klant", "geldigTot", "lines.0.omschrijving"]),
    );
  });

  it("weigert onveilige aantallen, prijzen en btw-percentages", () => {
    const issues = validateOfferteInput({
      ...validInput,
      lines: [
        {
          ...validInput.lines[0],
          aantal: 0,
          prijs_per_eenheid: -1,
          btw_percentage: 101,
        },
      ],
    });

    expect(issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining([
        "lines.0.aantal",
        "lines.0.prijs",
        "lines.0.btw",
      ]),
    );
  });
});

describe("offerteditorregressies", () => {
  it("filtert offerte en lijnen expliciet op tenant", () => {
    const editPage = source(
      "src/app/dashboard/offertes/[id]/bewerken/page.tsx",
    );
    const actions = source("src/app/dashboard/offertes/actions.ts");

    expect(editPage).toContain('.eq("bedrijf_id", companyId)');
    expect(editPage).toContain('.eq("company_id", companyId)');
    expect(actions.match(/\.eq\("company_id", companyId\)/g)?.length).toBeGreaterThanOrEqual(
      4,
    );
  });

  it("behoudt mislukte bijlagen en de bestaande expliciete verzendflow", () => {
    const form = source(
      "src/components/dashboard/offertes/OfferteForm.tsx",
    );

    expect(form).toContain("uploadProjectBestanden");
    expect(form).not.toContain("uploadOffertePhotosFromBase64");
    expect(form).toContain("setPendingFiles(failedFiles)");
    expect(form).toContain("setSendModalOpen(true)");
    expect(form).toContain("<SendOfferteModal");
  });

  it("houdt mobiele preview en fullscreen dialoog toegankelijk", () => {
    const preview = source(
      "src/components/dashboard/offertes/OfferteDocumentPreview.tsx",
    );

    expect(preview).toContain('aria-controls="offerte-mobile-preview"');
    expect(preview).toContain('role="dialog"');
    expect(preview).toContain('aria-modal="true"');
    expect(preview).toContain('event.key === "Escape"');
  });
});
