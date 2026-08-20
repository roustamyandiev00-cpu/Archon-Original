import type { SupabaseClient } from "@supabase/supabase-js";
import {
  projectIdFromOfferteType,
  projectNameFromOfferte,
  startLabelFromDate,
} from "@/components/dashboard/projecten/fromOfferte";
import { toDbProjectStatus } from "@/components/dashboard/projecten/projecten";
import type { OfferteLijnInput } from "@/lib/offertes";

type EnsureInput = {
  supabase: SupabaseClient;
  companyId: number;
  userId: string;
  offerte: {
    id: number;
    klant: string | null;
    notes: string | null;
    datum: string;
    customer_id: number | null;
    converted_to_type: string | null;
    nummer?: string | null;
    project_naam?: string | null;
    afmetingen?: string | null;
  };
  lines?: OfferteLijnInput[];
};

/**
 * Maakt (of hergebruikt) een project bij goedgekeurde offerte.
 * Koppelt bestaande offerte-bestanden aan het project.
 */
export async function ensureProjectFromOfferte(input: EnsureInput): Promise<{
  projectId: string | null;
  created: boolean;
  error?: string;
}> {
  const { supabase, companyId, userId, offerte } = input;

  const existingId = projectIdFromOfferteType(offerte.converted_to_type);
  if (existingId) {
    await attachOfferteBestandenToProject(supabase, companyId, offerte.id, existingId);
    await supabase
      .from("projecten")
      .update({
        status: toDbProjectStatus("actief"),
        customer_id: offerte.customer_id,
        offerte_id: offerte.id,
      })
      .eq("id", existingId)
      .eq("bedrijf_id", companyId);

    return { projectId: existingId, created: false };
  }

  let lines = input.lines;
  if (!lines) {
    const { data: lijnen } = await supabase
      .from("offerte_lijnen")
      .select("omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage")
      .eq("offerte_id", offerte.id)
      .order("sort_order", { ascending: true });
    lines = (lijnen ?? []) as OfferteLijnInput[];
  }

  const naam = projectNameFromOfferte({
    klant: offerte.klant || "Onbekende klant",
    notes: offerte.notes || "",
    lines,
    nummer: offerte.nummer ?? undefined,
    projectNaam: (offerte as { project_naam?: string | null }).project_naam,
  });

  const { data: project, error: projectError } = await supabase
    .from("projecten")
    .insert({
      bedrijf_id: companyId,
      naam,
      klant_naam: offerte.klant || "Onbekende klant",
      start_datum_label: startLabelFromDate(offerte.datum),
      status: toDbProjectStatus("actief"),
      customer_id: offerte.customer_id,
      offerte_id: offerte.id,
    })
    .select("id")
    .single();

  if (projectError || !project) {
    return {
      projectId: null,
      created: false,
      error: projectError?.message ?? "Project aanmaken mislukt.",
    };
  }

  const now = new Date().toISOString();
  await supabase
    .from("offertes")
    .update({
      converted_to_type: `project:${project.id}`,
      converted_at: now,
      converted_by: userId,
      updated_at: now,
    })
    .eq("id", offerte.id)
    .eq("bedrijf_id", companyId);

  await attachOfferteBestandenToProject(
    supabase,
    companyId,
    offerte.id,
    project.id as string,
  );

  return { projectId: project.id as string, created: true };
}

async function attachOfferteBestandenToProject(
  supabase: SupabaseClient,
  companyId: number,
  offerteId: number,
  projectId: string,
) {
  await supabase
    .from("project_bestanden")
    .update({ project_id: projectId, updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("offerte_id", offerteId)
    .is("project_id", null);
}
