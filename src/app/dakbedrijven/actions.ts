"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const DAK_BEDRIJVEN_MEDIA_BUCKET = "dakbedrijven-media";
const MAX_FOTO_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FOTOS = 8;

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w.\- ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50) || "foto";

export type DakBedrijfCategorie =
  | "winkel"
  | "bouwbedrijf"
  | "dakdekker"
  | "leverancier"
  | "overig";

export type CreateDakBedrijfInput = {
  naam: string;
  categorie: DakBedrijfCategorie;
  adres: string;
  postcode: string;
  stad: string;
  regio: string;
  telefoon: string;
  website: string;
  beschrijving: string;
  toegevoegdDoor: string;
  lat: number | null;
  lng: number | null;
};

/**
 * Voegt een dakwinkel/bouwbedrijf/dakdekker toe aan de publieke directory.
 * Bewust geen login vereist — de RLS-policy op `dak_bedrijven` staat
 * publieke inserts toe (zie supabase/migrations/20260709_dakbedrijven_directory.sql).
 */
export async function createDakBedrijf(input: CreateDakBedrijfInput) {
  if (!input.naam.trim()) {
    return { error: "Vul een bedrijfsnaam in." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dak_bedrijven")
    .insert({
      naam: input.naam.trim(),
      categorie: input.categorie || "bouwbedrijf",
      adres: input.adres.trim() || null,
      postcode: input.postcode.trim() || null,
      stad: input.stad.trim() || null,
      regio: input.regio.trim() || null,
      telefoon: input.telefoon.trim() || null,
      website: input.website.trim() || null,
      beschrijving: input.beschrijving.trim() || null,
      toegevoegd_door: input.toegevoegdDoor.trim() || null,
      lat: input.lat,
      lng: input.lng,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dakbedrijven");
  return { id: data.id as number };
}

/**
 * Uploadt foto's voor een dakbedrijf naar de publieke bucket
 * `dakbedrijven-media` (map <dak_bedrijf_id>/...) en zet de publieke URL's
 * op dak_bedrijven.fotos. Geen login vereist.
 */
export async function uploadDakBedrijfFotos(
  dakBedrijfId: number,
  formData: FormData,
) {
  const supabase = await createClient();

  const { data: bedrijf } = await supabase
    .from("dak_bedrijven")
    .select("id, fotos")
    .eq("id", dakBedrijfId)
    .maybeSingle();

  if (!bedrijf) return { error: "Dit bedrijf bestaat niet (meer)." };

  const files = formData
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) return { urls: [] as string[] };
  if (files.length > MAX_FOTOS) {
    return { error: `Maximaal ${MAX_FOTOS} foto's per bedrijf.` };
  }

  const urls: string[] = [];
  for (const file of files) {
    if (file.size > MAX_FOTO_BYTES) {
      return { error: `"${file.name}" is te groot (max. 10 MB).` };
    }
    const path = `${dakBedrijfId}/${Date.now()}-${slugify(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(DAK_BEDRIJVEN_MEDIA_BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
    if (uploadError) {
      return { error: `Uploaden mislukt: ${uploadError.message}` };
    }
    const { data: pub } = supabase.storage
      .from(DAK_BEDRIJVEN_MEDIA_BUCKET)
      .getPublicUrl(path);
    urls.push(pub.publicUrl);
  }

  const existing = (bedrijf.fotos ?? []) as string[];
  const { error: updateError } = await supabase
    .from("dak_bedrijven")
    .update({ fotos: [...existing, ...urls] })
    .eq("id", dakBedrijfId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/dakbedrijven");
  return { urls };
}

export type CreateDakBedrijfReviewInput = {
  naam: string;
  rating: number;
  commentaar: string;
};

/**
 * Plaatst een review (sterren + commentaar) bij een dakbedrijf. Geen login
 * vereist — iedereen mag reviewen.
 */
export async function createDakBedrijfReview(
  dakBedrijfId: number,
  input: CreateDakBedrijfReviewInput,
) {
  if (!input.commentaar.trim()) {
    return { error: "Schrijf een korte review." };
  }
  if (!input.rating || input.rating < 1 || input.rating > 5) {
    return { error: "Kies een beoordeling van 1 tot 5 sterren." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("dak_bedrijf_reviews").insert({
    dak_bedrijf_id: dakBedrijfId,
    naam: input.naam.trim() || "Anoniem",
    rating: input.rating,
    commentaar: input.commentaar.trim(),
  });

  if (error) return { error: error.message };

  revalidatePath("/dakbedrijven");
  return { success: true };
}
