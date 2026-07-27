"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import type { Json } from "@/types/database.types";
import {
  createGoogleEvent,
  deelnemersWithGoogleEventId,
  getValidGoogleAccessToken,
  googleEventIdFromDeelnemers,
  listUpcomingEvents,
  loadGoogleCalendarConnection,
} from "@/components/dashboard/agenda/googleCalendar";

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

  let googlePushed = false;
  const tokenResult = await getValidGoogleAccessToken(supabase, companyId);
  if ("accessToken" in tokenResult) {
    const created = await createGoogleEvent(tokenResult.accessToken, {
      title: titel,
      description: input.beschrijving?.trim() || null,
      location: input.locatie?.trim() || null,
      startIso,
      endIso: eindIso,
    });
    if ("eventId" in created) {
      await supabase
        .from("afspraken")
        .update({
          deelnemers: deelnemersWithGoogleEventId(null, created.eventId) as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .eq("bedrijf_id", companyId);
      googlePushed = true;
    }
  }

  revalidatePath("/dashboard/agenda");
  return { ok: true as const, id: data.id, googlePushed };
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

/** Importeert Google Calendar-events naar lokale afspraken (upsert op googleEventId). */
export async function syncGoogleCalendar() {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, user, companyId } = access;

  const connection = await loadGoogleCalendarConnection(supabase, companyId);
  if (!connection.connected) {
    return {
      error:
        "Google Calendar is niet gekoppeld. Verbind eerst je Google-account.",
    };
  }

  const tokenResult = await getValidGoogleAccessToken(supabase, companyId);
  if ("error" in tokenResult) return { error: tokenResult.error };

  const listed = await listUpcomingEvents(tokenResult.accessToken);
  if ("error" in listed) return { error: listed.error };

  const { data: existing } = await supabase
    .from("afspraken")
    .select("id, deelnemers")
    .eq("bedrijf_id", companyId)
    .limit(500);

  const byGoogleId = new Map<string, number>();
  for (const row of existing ?? []) {
    const gid = googleEventIdFromDeelnemers(row.deelnemers);
    if (gid) byGoogleId.set(gid, row.id);
  }

  let imported = 0;
  let updated = 0;

  for (const event of listed.events) {
    const knownId = byGoogleId.get(event.id);
    const patch = {
      titel: event.summary,
      beschrijving: event.description,
      locatie: event.location,
      start_tijd: event.start,
      eind_tijd: event.end,
      type: "google",
      status: "gepland",
      deelnemers: deelnemersWithGoogleEventId(null, event.id) as Json,
      updated_at: new Date().toISOString(),
    };

    if (knownId) {
      const { error } = await supabase
        .from("afspraken")
        .update(patch)
        .eq("id", knownId)
        .eq("bedrijf_id", companyId);
      if (!error) updated += 1;
      continue;
    }

    const { error } = await supabase.from("afspraken").insert({
      ...patch,
      bedrijf_id: companyId,
      user_id: user.id,
    });
    if (!error) imported += 1;
  }

  revalidatePath("/dashboard/agenda");
  return {
    ok: true as const,
    imported,
    updated,
    total: listed.events.length,
    accountEmail: connection.accountEmail,
  };
}
