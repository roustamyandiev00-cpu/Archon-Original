"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import { untyped } from "@/lib/integraties";
import { searchBouwmateriaalPrijzen } from "@/lib/bouwmaterialen/prijzen";
import { proposeAgentAction } from "@/lib/agents/propose";
import { evaluatePolicy } from "@/lib/agents/policy";

export async function addBouwmateriaalPrijs(input: {
  winkelId: number;
  productnaam: string;
  merk?: string | null;
  prijs: number;
  eenheid?: string;
  bronUrl?: string | null;
  btwStatus?: "incl" | "excl" | "onbekend";
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const naam = input.productnaam.trim();
  if (!naam) return { error: "Productnaam is verplicht." };
  if (!(input.prijs >= 0)) return { error: "Ongeldige prijs." };

  const { error } = await untyped(supabase).from("bouwmateriaal_prijzen").insert({
    winkel_id: input.winkelId,
    productnaam: naam,
    merk: input.merk?.trim() || null,
    prijs: input.prijs,
    eenheid: input.eenheid?.trim() || "stuks",
    bron_url: input.bronUrl?.trim() || null,
    gecontroleerd_op: new Date().toISOString(),
    btw_status: input.btwStatus ?? "onbekend",
    created_by_company_id: companyId,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/bouwmaterialen");
  revalidatePath("/bouwmaterialen");
  return { ok: true as const };
}

export async function runMateriaalzoekteAgent(input: {
  query: string;
  regio?: string | null;
  budgetMax?: number | null;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const hits = await searchBouwmateriaalPrijzen(supabase, input);
  if (hits.length === 0) {
    return { ok: true as const, hits: [], actionId: null as number | null };
  }

  const policy = evaluatePolicy({
    agentId: "Nova",
    actionType: "propose_materiaal_zoek",
    tenantId: companyId,
    isExternal: false,
  });

  let actionId: number | null = null;
  if (policy.allowed) {
    const proposed = await proposeAgentAction({
      supabase,
      companyId,
      agentName: "Nova",
      actionType: "propose_materiaal_zoek",
      title: `Materiaalvoorraad: ${input.query.slice(0, 60)}`,
      reason: `${hits.length} resultaten · brondatum verplicht getoond`,
      payload: {
        query: input.query,
        regio: input.regio ?? null,
        hits: hits.slice(0, 15),
      },
      targetRoute: "/dashboard/bouwmaterialen",
      requiresApproval: false,
      confidence: 0.8,
    });
    if (!("error" in proposed)) actionId = proposed.id ?? null;
  }

  return { ok: true as const, hits, actionId };
}
