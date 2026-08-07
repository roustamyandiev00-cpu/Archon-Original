import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { PrijslijstPickItem } from "@/components/dashboard/prijslijst/types";

type TypedSupabase = SupabaseClient<Database>;

export async function loadActivePrijslijstItems(
  supabase: TypedSupabase,
  companyId: number,
): Promise<PrijslijstPickItem[]> {
  const { data } = await supabase
    .from("prijslijst_items")
    .select("id, omschrijving, eenheid, prijs, btw_percentage, categorie")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("omschrijving", { ascending: true })
    .limit(300);

  return (data ?? []).map((row) => ({
    id: row.id,
    omschrijving: row.omschrijving,
    eenheid: row.eenheid || "stuks",
    prijs: Number(row.prijs) || 0,
    btwPercentage: Number(row.btw_percentage) || 0,
    categorie: row.categorie,
  }));
}
