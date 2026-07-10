import type { SupabaseClient } from "@supabase/supabase-js";
import { untyped } from "@/lib/integraties";
import { normalizeStructuredCommunication } from "@/lib/peppol/be";

type OpenFactuur = {
  id: number;
  nummer: string | null;
  totaal_bedrag: number | null;
  structured_communication: string | null;
  status: string | null;
  paid_at: string | null;
};

export async function matchBankTransactions(
  supabaseClient: unknown,
  companyId: number,
): Promise<{ matched: number; open: number }> {
  const supabase = untyped(supabaseClient) as SupabaseClient;

  const [{ data: transacties }, { data: facturen }] = await Promise.all([
    supabase
      .from("bank_transacties")
      .select(
        "id, bedrag, gestructureerde_mededeling, omschrijving, match_status",
      )
      .eq("bedrijf_id", companyId)
      .eq("match_status", "open")
      .gt("bedrag", 0),
    supabase
      .from("facturen")
      .select(
        "id, nummer, totaal_bedrag, structured_communication, status, paid_at",
      )
      .eq("bedrijf_id", companyId)
      .is("paid_at", null)
      .neq("status", "concept"),
  ]);

  const openFacturen = (facturen ?? []) as OpenFactuur[];
  let matched = 0;

  for (const tx of transacties ?? []) {
    const txAmount = Number(tx.bedrag);
    const txOgm = tx.gestructureerde_mededeling
      ? normalizeStructuredCommunication(tx.gestructureerde_mededeling)
      : null;

    let hit: OpenFactuur | undefined;

    if (txOgm) {
      hit = openFacturen.find(
        (f) =>
          f.structured_communication &&
          normalizeStructuredCommunication(f.structured_communication) === txOgm,
      );
    }

    if (!hit) {
      hit = openFacturen.find(
        (f) =>
          Math.abs(Number(f.totaal_bedrag ?? 0) - txAmount) < 0.02 &&
          !f.paid_at,
      );
    }

    if (!hit) continue;

    const now = new Date().toISOString();
    await supabase
      .from("bank_transacties")
      .update({
        match_status: "gematcht",
        factuur_id: hit.id,
        updated_at: now,
      })
      .eq("id", tx.id);

    await supabase
      .from("facturen")
      .update({
        status: "betaald",
        paid_at: now,
        updated_at: now,
      })
      .eq("id", hit.id)
      .eq("bedrijf_id", companyId);

    await supabase.from("betalingen").insert({
      bedrijf_id: companyId,
      factuur_id: hit.id,
      bedrag: txAmount,
      datum: now.slice(0, 10),
      betaalmethode: "overschrijving",
      referentie: txOgm ?? tx.omschrijving ?? null,
    });

    openFacturen.splice(openFacturen.indexOf(hit), 1);
    matched += 1;
  }

  const { count } = await supabase
    .from("bank_transacties")
    .select("id", { count: "exact", head: true })
    .eq("bedrijf_id", companyId)
    .eq("match_status", "open");

  return { matched, open: count ?? 0 };
}
