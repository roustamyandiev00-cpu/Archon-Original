"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import type { ProjectStatus } from "@/components/dashboard/projecten/projecten";

const STATUSES = new Set<ProjectStatus>([
  "gepland",
  "actief",
  "afgerond",
  "gepauzeerd",
]);

export async function createProject(input: {
  naam: string;
  klant_naam: string;
  start_datum_label?: string;
  status?: ProjectStatus;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const naam = input.naam.trim();
  const klant = input.klant_naam.trim();
  if (!naam) return { error: "Projectnaam is verplicht." };
  if (!klant) return { error: "Klantnaam is verplicht." };

  const status =
    input.status && STATUSES.has(input.status) ? input.status : "gepland";
  const startLabel =
    input.start_datum_label?.trim() ||
    new Date().toLocaleDateString("nl-BE", {
      month: "short",
      year: "numeric",
    });

  const { data, error } = await supabase
    .from("projecten")
    .insert({
      bedrijf_id: companyId,
      naam,
      klant_naam: klant,
      start_datum_label: startLabel,
      status,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/offertes/projecten");
  return { id: data.id as string };
}

export async function updateProjectStatus(id: string, status: ProjectStatus) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  if (!STATUSES.has(status)) return { error: "Ongeldige status." };

  const { error } = await supabase
    .from("projecten")
    .update({ status })
    .eq("id", id)
    .eq("bedrijf_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/offertes/projecten");
  revalidatePath(`/dashboard/offertes/projecten/${id}`);
  return { ok: true };
}
