import type { SupabaseClient } from "@supabase/supabase-js";
import { untyped } from "@/lib/integraties";
import type { PrijslijstPickItem } from "@/components/dashboard/prijslijst/types";

type Row = {
  id: number;
  omschrijving: string;
  eenheid: string;
  prijs: number | string;
  btw_percentage: number | string;
  categorie: string | null;
};

export async function loadActivePrijslijstItems(
  supabase: SupabaseClient,
  companyId: number,
): Promise<PrijslijstPickItem[]> {
  const { data } = await untyped(supabase)
    .from("prijslijst_items")
    .select("id, omschrijving, eenheid, prijs, btw_percentage, categorie")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("omschrijving", { ascending: true })
    .limit(300);

  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    omschrijving: row.omschrijving,
    eenheid: row.eenheid || "stuks",
    prijs: Number(row.prijs) || 0,
    btwPercentage: Number(row.btw_percentage) || 0,
    categorie: row.categorie,
  }));
}
