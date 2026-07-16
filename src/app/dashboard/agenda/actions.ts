"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";

const STATUSES = new Set(["gepland", "bevestigd", "geannuleerd", "afgerond"]);

export type AgendaAfspraakInput = {
  titel: string;
  datum: string;
  startTijd: string;
  eindTijd?: string;
  locatie?: string;
  beschrijving?: string;
  type?: string;
};

function toIso(datum: string, tijd: string): string | null {
  if (!datum || !tijd) return null;
  const d = new Date(`${datum}T${tijd}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function createAgendaAfspraak(input: AgendaAfspraakInput) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const titel = input.titel.trim();
  if (!titel) return { error: "Geef de afspraak een titel." };

  const startIso = toIso(input.datum, input.startTijd);
  if (!startIso) return { error: "Kies een geldige datum en starttijd." };

  const eindIso = input.eindTijd ? toIso(input.datum, input.eindTijd) : null;
  if (eindIso && eindIso <= startIso) {
    return { error: "De eindtijd moet na de starttijd liggen." };
  }

  const { data, error } = await supabase
    .from("afspraken")
    .insert({
      titel,
      beschrijving: input.beschrijving?.trim() || null,
      locatie: input.locatie?.trim() || null,
      start_tijd: startIso,
      eind_tijd: eindIso,
      type: input.type?.trim() || "intern",
      status: "gepland",
      bedrijf_id: companyId,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/agenda");
  return { ok: true as const, id: data.id };
}

export async function updateAgendaAfspraakStatus(
  id: number,
  status: string,
) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  if (!STATUSES.has(status)) return { error: "Ongeldige status." };

  const { error } = await supabase
    .from("afspraken")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("bedrijf_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/agenda");
  return { ok: true as const };
}

export async function deleteAgendaAfspraak(id: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { error } = await supabase
    .from("afspraken")
    .delete()
    .eq("id", id)
    .eq("bedrijf_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/agenda");
  return { ok: true as const };
}
