/**
 * Genereer Peppol UBL XML lokaal (geen Storecove, geen browser-login).
 * Gebruik: node --env-file=.env.local --import tsx scripts/generate-peppol-ubl.ts [factuur_id]
 */

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { buildFactuurUbl, getPeppolConfig } from "@/lib/peppol/build";
import { buildInvoiceUBL } from "@/lib/peppol/ubl";
import { createServiceClient } from "@/lib/supabase/service";

const factuurId = Number(process.argv[2] ?? "1");
const companyId = Number(process.env.PEPPOL_BEDRIJF_ID ?? "10");

if (Number.isNaN(factuurId)) {
  console.error("Ongeldig factuur-id.");
  process.exit(1);
}

async function main() {
  const supabase = createServiceClient();
  const peppol = await getPeppolConfig(supabase, companyId);
  const built = await buildFactuurUbl(supabase, companyId, factuurId, peppol);

  if (!built) {
    console.error(`Factuur ${factuurId} niet gevonden voor bedrijf ${companyId}.`);
    process.exit(1);
  }

  const xml = buildInvoiceUBL(built.ubl);
  const outDir = join(process.cwd(), "exports");
  mkdirSync(outDir, { recursive: true });
  const safeNummer = built.nummer.replace(/[^\w.-]+/g, "-");
  const outFile = join(outDir, `peppol-factuur-${factuurId}-${safeNummer}.xml`);

  writeFileSync(outFile, xml, "utf8");

  console.log("UBL gegenereerd:", outFile);
  console.log("Factuur:", built.nummer, "→", built.ubl.customer.name);
  console.log(
    "Peppol-validatie:",
    built.readiness.ok ? "OK" : "issues",
  );
  if (!built.readiness.ok) {
    for (const issue of built.readiness.issues) {
      console.log(`  [${issue.severity}] ${issue.field}: ${issue.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
