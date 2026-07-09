"use server";

import { requireWriteAccess } from "@/components/dashboard/context";
import { getPeppolConfig, buildFactuurUbl } from "@/lib/peppol/build";
import { buildInvoiceUBL } from "@/lib/peppol/ubl";
import { sendViaAccessPoint } from "@/lib/peppol/send";

/** Verstuurt een factuur als e-factuur via het geconfigureerde Peppol access point. */
export async function sendFactuurViaPeppol(factuurId: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const peppol = await getPeppolConfig(supabase, companyId);
  if (!peppol) {
    return {
      error:
        "Peppol is niet verbonden. Ga naar Integraties → Peppol en configureer een access point.",
    };
  }

  const built = await buildFactuurUbl(supabase, companyId, factuurId, peppol);
  if (!built) return { error: "Factuur niet gevonden." };

  const xml = buildInvoiceUBL(built.ubl);
  const result = await sendViaAccessPoint(peppol, xml, {
    vat: built.ubl.customer.vat,
  });

  if (!result.ok) return { error: result.error };
  return { ok: true, id: result.id };
}
