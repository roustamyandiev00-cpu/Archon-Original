import type { SupabaseClient } from "@supabase/supabase-js";
import { untyped } from "@/lib/integraties";

/**
 * Server-side betrouwbaarheidsscore (0–100).
 * Formule mag NIET naar de client gelekt worden — alleen het resultaat.
 */
export async function computeBetrouwbaarheidsscore(
  supabase: SupabaseClient,
  companyId: number,
): Promise<number> {
  const db = untyped(supabase);
  const [
    { count: signedContracts },
    { count: reviewsGiven },
    { data: reviewStats },
    { count: openSanctions },
    { count: confirmedSanctions },
    { data: bedrijf },
  ] = await Promise.all([
    supabase
      .from("samenwerking_contracts")
      .select("id", { count: "exact", head: true })
      .eq("status", "signed")
      .or(
        `party_a_company_id.eq.${companyId},party_b_company_id.eq.${companyId}`,
      ),
    supabase
      .from("bedrijf_reviews")
      .select("id", { count: "exact", head: true })
      .eq("reviewer_company_id", companyId),
    supabase
      .from("bedrijf_reviews")
      .select("rating")
      .eq("target_company_id", companyId),
    db
      .from("bedrijf_sancties")
      .select("id", { count: "exact", head: true })
      .eq("bedrijf_id", companyId)
      .eq("status", "voorgesteld"),
    db
      .from("bedrijf_sancties")
      .select("id", { count: "exact", head: true })
      .eq("bedrijf_id", companyId)
      .eq("status", "bevestigd"),
    supabase
      .from("bedrijven")
      .select("verificatiestatus")
      .eq("id", companyId)
      .maybeSingle(),
  ]);

  let score = 50;

  const contracts = signedContracts ?? 0;
  score += Math.min(20, contracts * 4);

  const ratings = (reviewStats ?? []).map((r) => Number(r.rating) || 0);
  if (ratings.length > 0) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    score += Math.round((avg - 3) * 8);
    score += Math.min(10, ratings.length * 2);
  }

  if (bedrijf?.verificatiestatus === "geverifieerd") score += 10;
  else if (bedrijf?.verificatiestatus === "in_behandeling") score += 3;

  score -= Math.min(15, (openSanctions ?? 0) * 3);
  score -= Math.min(40, (confirmedSanctions ?? 0) * 15);

  if ((reviewsGiven ?? 0) > 0) score += 2;

  return Math.max(0, Math.min(100, score));
}

/** Herbereken en cache op bedrijven.betrouwbaarheidsscore. */
export async function refreshBetrouwbaarheidsscore(
  supabase: SupabaseClient,
  companyId: number,
): Promise<number> {
  const score = await computeBetrouwbaarheidsscore(supabase, companyId);
  await untyped(supabase)
    .from("bedrijven")
    .update({
      betrouwbaarheidsscore: score,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId);
  return score;
}
