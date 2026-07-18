import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveFacturenAccessIssue } from "@/lib/facturen/load-facturen-data";
import { displayedFactuurAmount } from "@/components/dashboard/facturen/FactuurDetailView";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("facturen read-path regressions", () => {
  it("onderscheidt auth- en contextproblemen van een echte lege lijst", () => {
    expect(
      resolveFacturenAccessIssue({
        hasUser: false,
        hasCompany: false,
        isPreview: false,
      }),
    ).toBe("unauthenticated");
    expect(
      resolveFacturenAccessIssue({
        hasUser: true,
        hasCompany: false,
        isPreview: false,
      }),
    ).toBe("missing-company");
    expect(
      resolveFacturenAccessIssue({
        hasUser: true,
        hasCompany: true,
        isPreview: false,
      }),
    ).toBeNull();
  });

  it("behoudt expliciete tenantfilters voor lijstverrijking en detaillijnen", () => {
    expect(source("src/lib/facturen/load-facturen-data.ts")).toMatch(
      /from\("customers"\)[\s\S]*?select\("id, email, phone"\)[\s\S]*?eq\("company_id", companyId\)/,
    );
    expect(source("src/app/dashboard/facturen/[id]/page.tsx")).toMatch(
      /from\("factuur_lijnen"\)[\s\S]*?eq\("factuur_id", factuurId\)[\s\S]*?eq\("company_id", companyId\)/,
    );
  });

  it("onderscheidt een detailqueryfout van not-found", () => {
    const detailPage = source("src/app/dashboard/facturen/[id]/page.tsx");
    expect(detailPage.indexOf("if (factuurError)")).toBeGreaterThan(-1);
    expect(detailPage.indexOf("if (!factuur) notFound()" )).toBeGreaterThan(
      detailPage.indexOf("if (factuurError)"),
    );
  });

  it("toont betaald en openstaand zonder een geldige nul te vervangen", () => {
    expect(
      displayedFactuurAmount({ isPaid: true, paidAmount: 125, openAmount: 0 }),
    ).toBe(125);
    expect(
      displayedFactuurAmount({ isPaid: false, paidAmount: 125, openAmount: 0 }),
    ).toBe(0);
  });

  it("maakt fouten van de betaalactie zichtbaar", () => {
    const table = source(
      "src/components/dashboard/facturen/FacturenDataTable.tsx",
    );
    expect(table).toContain("setActionError(result.error)");
    expect(table).toContain('role="alert"');
  });

  it("bevat geen hardcoded facturenbadge", () => {
    const nav = source("src/components/dashboard/sidebar-nav.ts");
    const facturenItem = nav.match(
      /label: "Facturen",[\s\S]*?href: "\/dashboard\/facturen",[\s\S]*?\},/,
    )?.[0];
    expect(facturenItem).toBeDefined();
    expect(facturenItem).not.toContain("badge:");
  });
});
