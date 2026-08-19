import { describe, expect, it } from "vitest";
import { checkContractCompleteness } from "@/lib/werkposts/contract-completeness";

describe("checkContractCompleteness", () => {
  it("flags missing required themes", () => {
    const { missing, ok } = checkContractCompleteness({
      titel: "Samenwerking",
      sections: [{ heading: "Intro", body: "We werken samen." }],
    });
    expect(ok).toBe(false);
    expect(missing.length).toBeGreaterThan(3);
  });

  it("passes when structured fields and sections cover themes", () => {
    const { ok, missing } = checkContractCompleteness({
      titel: "Samenwerking dakwerken",
      tarief: "45 eur/uur",
      startdatum: "2026-08-01",
      einddatum: "2026-09-01",
      sections: [
        {
          heading: "Omschrijving werken",
          body: "Dakrenovatie inclusief materiaalverantwoordelijkheid van de uitvoerder.",
        },
        {
          heading: "Locatie",
          body: "Werfadres te Antwerpen.",
        },
        {
          heading: "Betaling",
          body: "Factuur binnen 30 dagen, betaling via ArchonPro.",
        },
        {
          heading: "Aansprakelijkheid",
          body: "Partijen zijn verzekerd.",
        },
        {
          heading: "Annulering",
          body: "Annulering minstens 7 dagen vooraf.",
        },
        {
          heading: "Meerwerk",
          body: "Meerwerk enkel na schriftelijke goedkeuring.",
        },
        {
          heading: "Contactpersonen",
          body: "Contact via het platformkanaal.",
        },
      ],
    });
    expect(missing).toEqual([]);
    expect(ok).toBe(true);
  });
});
