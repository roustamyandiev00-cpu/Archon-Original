"use server";

import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/components/dashboard/context";
import {
  normalizeBelgianVat,
  normalizeKbo,
  peppolEndpointFromParty,
} from "@/lib/peppol/be";

export type KlantInput = {
  name: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  postcode?: string;
  city?: string;
  country?: string;
  ondernemingsnummer?: string;
  btw?: string;
  peppol_participant_id?: string;
  notes?: string;
};

function clean(input: KlantInput) {
  const name =
    input.name.trim() ||
    [input.first_name, input.last_name].filter(Boolean).join(" ").trim() ||
    input.company_name?.trim() ||
    "";

  const kbo =
    normalizeKbo(input.ondernemingsnummer) ??
    (input.ondernemingsnummer?.trim() || null);
  const vat =
    normalizeBelgianVat(input.btw) ?? (input.btw?.trim() || null);

  let peppolId = input.peppol_participant_id?.trim() || null;
  if (!peppolId) {
    const ep = peppolEndpointFromParty({
      peppolParticipantId: null,
      kbo,
      vat,
    });
    if (ep) peppolId = `${ep.scheme}:${ep.value}`;
  }

  return {
    name,
    company_name: input.company_name?.trim() || null,
    first_name: input.first_name?.trim() || null,
    last_name: input.last_name?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    postcode: input.postcode?.trim() || null,
    city: input.city?.trim() || null,
    country: (input.country?.trim() || "BE").toUpperCase(),
    ondernemingsnummer: kbo,
    kvk: kbo,
    btw: vat,
    peppol_participant_id: peppolId,
    notes: input.notes?.trim() || null,
    is_active: true,
  };
}

export async function createKlant(input: KlantInput) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const row = clean(input);
  if (!row.name) return { error: "Naam is verplicht." };

  const { data, error } = await supabase
    .from("customers")
    .insert({
      company_id: companyId,
      created_by: user.id,
      ...row,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/contacten");
  revalidatePath("/dashboard");
  return { ok: true, id: data.id };
}

export async function updateKlant(id: number, input: KlantInput) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const row = clean(input);
  if (!row.name) return { error: "Naam is verplicht." };

  const { error } = await supabase
    .from("customers")
    .update({
      ...row,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/contacten");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteKlant(id: number) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { error } = await supabase
    .from("customers")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/contacten");
  return { ok: true };
}
