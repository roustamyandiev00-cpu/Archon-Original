"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { lineTotals, statusMeta } from "@/lib/offertes";
import { documentTypeMeta } from "@/lib/facturen";
import {
  loadCompanyDefaultTemplate,
} from "@/components/dashboard/documenten/documentTemplate";

export async function convertOfferteToFactuur(offerteId: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const { data: offerte } = await supabase
    .from("offertes")
    .select(
      "id, nummer, klant, bedrag, datum, geldig_tot, notes, status_new, customer_id, converted_to_invoice_id",
    )
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!offerte) return { error: "Offerte niet gevonden." };
  if (offerte.converted_to_invoice_id) {
    return { id: offerte.converted_to_invoice_id as number };
  }

  const allowed = ["geaccepteerd", "verzonden", "bekeken"];
  if (!allowed.includes(offerte.status_new ?? "")) {
    return {
      error: "Alleen geaccepteerde of verzonden offertes kunnen worden omgezet.",
    };
  }

  const { data: lijnen } = await supabase
    .from("offerte_lijnen")
    .select("omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage")
    .eq("offerte_id", offerteId)
    .order("sort_order");

  const lines = (lijnen ?? []).map((l) => ({
    omschrijving: l.omschrijving ?? "",
    aantal: Number(l.aantal ?? 0),
    eenheid: l.eenheid ?? "stuks",
    prijs_per_eenheid: Number(l.prijs_per_eenheid ?? 0),
    btw_percentage: Number(l.btw_percentage ?? 0),
  }));

  if (lines.length === 0) {
    return { error: "Offerte heeft geen lijnen." };
  }

  const { subtotaal, btw, totaal } = lineTotals(lines);
  const year = new Date().getFullYear();
  const prefix = documentTypeMeta("factuur").prefix;

  const { data: laatste } = await supabase
    .from("facturen")
    .select("nummer")
    .eq("bedrijf_id", companyId)
    .eq("document_type", "factuur")
    .like("nummer", `${prefix}-${year}-%`)
    .order("nummer", { ascending: false })
    .limit(1)
    .maybeSingle();

  let seq = 1;
  if (laatste?.nummer) {
    const m = String(laatste.nummer).match(/(\d+)\s*$/);
    if (m) seq = parseInt(m[1], 10) + 1;
  }

  const templateId = await loadCompanyDefaultTemplate(
    supabase,
    companyId,
    "invoice",
  );

  let factuur: { id: number } | null = null;
  let lastError: { message: string } | null = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    const nummer = `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
    const res = await supabase
      .from("facturen")
      .insert({
        nummer,
        klant: offerte.klant || "Onbekende klant",
        customer_id: offerte.customer_id,
        bedrijf_id: companyId,
        user_id: user.id,
        document_type: "factuur",
        offerte_id: offerteId,
        bedrag: subtotaal,
        btw_bedrag: btw,
        totaal_bedrag: totaal,
        datum: new Date().toISOString().slice(0, 10),
        vervaldatum: offerte.geldig_tot,
        omschrijving: offerte.notes
          ? `Factuur naar aanleiding van offerte ${offerte.nummer ?? offerteId}`
          : `Factuur naar aanleiding van offerte ${offerte.nummer ?? offerteId}`,
        notities: offerte.notes,
        status: "concept",
        template_id: templateId,
      })
      .select("id")
      .single();

    if (!res.error && res.data) {
      factuur = res.data as { id: number };
      lastError = null;
      break;
    }
    lastError = res.error;
    if (res.error?.code === "23505") {
      seq += 1;
      continue;
    }
    break;
  }

  if (!factuur) {
    return { error: lastError?.message ?? "Factuur aanmaken mislukt." };
  }

  const factuurLijnen = lines.map((l, i) => ({
    factuur_id: factuur!.id,
    company_id: companyId,
    omschrijving: l.omschrijving,
    aantal: l.aantal,
    eenheid: l.eenheid,
    prijs_per_eenheid: l.prijs_per_eenheid,
    btw_percentage: l.btw_percentage,
    sort_order: i,
  }));

  const { error: lineError } = await supabase
    .from("factuur_lijnen")
    .insert(factuurLijnen);

  if (lineError) {
    return { error: lineError.message };
  }

  const now = new Date().toISOString();
  const { error: offerteError } = await supabase
    .from("offertes")
    .update({
      converted_to_invoice_id: factuur.id,
      converted_at: now,
      converted_by: user.id,
      converted_to_type: "factuur",
      status_new: "gefactureerd",
      status: statusMeta("gefactureerd").label,
      updated_at: now,
    })
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId);

  if (offerteError) {
    return { error: offerteError.message };
  }

  await supabase.rpc("log_offerte_activity", {
    p_offerte_id: offerteId,
    p_company_id: companyId,
    p_activity_type: "converted_to_invoice",
    p_old_status: offerte.status_new ?? undefined,
    p_new_status: "gefactureerd",
    p_performed_by: user.id,
    p_metadata: { factuur_id: factuur.id },
  });

  revalidatePath("/dashboard/offertes");
  revalidatePath(`/dashboard/offertes/${offerteId}`);
  revalidatePath("/dashboard/facturen");
  return { id: factuur.id as number };
}
