import type { SupabaseClient } from "@supabase/supabase-js";
import { untyped } from "@/lib/integraties";

export type MateriaalvoorraadHit = {
  prijsId: string;
  winkelId: number;
  winkelNaam: string;
  productnaam: string;
  merk: string | null;
  prijs: number;
  eenheid: string;
  btwStatus: string;
  gecontroleerdOp: string;
  bronUrl: string | null;
  regio: string | null;
  isStale: boolean;
};

const STALE_DAYS = 14;

/** Zoek prijzen; toont nooit als "actueel" zonder brondatum (altijd gecontroleerd_op). */
export async function searchBouwmateriaalPrijzen(
  supabase: SupabaseClient,
  input: {
    query: string;
    regio?: string | null;
    budgetMax?: number | null;
    limit?: number;
  },
): Promise<MateriaalvoorraadHit[]> {
  const q = input.query.trim();
  if (!q) return [];

  let req = untyped(supabase)
    .from("bouwmateriaal_prijzen")
    .select(
      "id, winkel_id, productnaam, merk, prijs, eenheid, btw_status, gecontroleerd_op, bron_url, bouwmateriaal_winkels(id, naam, regio)",
    )
    .ilike("productnaam", `%${q}%`)
    .order("gecontroleerd_op", { ascending: false })
    .limit(input.limit ?? 40);

  if (input.budgetMax != null) {
    req = req.lte("prijs", input.budgetMax);
  }

  const { data } = await req;
  const staleBefore = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;

  const hits: MateriaalvoorraadHit[] = [];
  for (const row of data ?? []) {
    const winkel = Array.isArray(row.bouwmateriaal_winkels)
      ? row.bouwmateriaal_winkels[0]
      : row.bouwmateriaal_winkels;
    if (
      input.regio?.trim() &&
      winkel?.regio &&
      !String(winkel.regio)
        .toLowerCase()
        .includes(input.regio.trim().toLowerCase())
    ) {
      continue;
    }
    const checked = new Date(row.gecontroleerd_op).getTime();
    hits.push({
      prijsId: row.id,
      winkelId: row.winkel_id,
      winkelNaam: winkel?.naam ?? `Winkel #${row.winkel_id}`,
      productnaam: row.productnaam,
      merk: row.merk,
      prijs: Number(row.prijs),
      eenheid: row.eenheid,
      btwStatus: row.btw_status,
      gecontroleerdOp: row.gecontroleerd_op,
      bronUrl: row.bron_url,
      regio: winkel?.regio ?? null,
      isStale: !Number.isFinite(checked) || checked < staleBefore,
    });
  }
  return hits;
}

/** Markeer verouderde prijzen (hercheck-signaal voor agent/admin). */
export async function findStaleBouwmateriaalPrijzen(
  supabase: SupabaseClient,
  olderThanDays = STALE_DAYS,
): Promise<number> {
  const cutoff = new Date(
    Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { count } = await untyped(supabase)
    .from("bouwmateriaal_prijzen")
    .select("id", { count: "exact", head: true })
    .lt("gecontroleerd_op", cutoff);
  return count ?? 0;
}

export function btwDisclaimer(btwStatus: string): string {
  if (btwStatus === "incl") return "Prijs incl. btw";
  if (btwStatus === "excl") return "Prijs excl. btw";
  return "incl./excl. btw onbekend — controleer bij bron";
}
