"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BOUWMATERIALEN_MEDIA_BUCKET = "bouwmaterialen-media";
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

export type BouwmateriaalCategorie = "dak" | "tegels";

export type CreateBouwmateriaalWinkelInput = {
  naam: string;
  categorie: BouwmateriaalCategorie;
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
 * Voegt een bouwmaterialenwinkel (dak of tegels) toe aan de publieke
 * directory. Bewust geen login vereist — de RLS-policy op
 * `bouwmateriaal_winkels` staat publieke inserts toe (zie
 * supabase/migrations/20260710_bouwmaterialen_directory.sql).
 */
export async function createBouwmateriaalWinkel(
  input: CreateBouwmateriaalWinkelInput,
) {
  if (!input.naam.trim()) {
    return { error: "Vul een winkelnaam in." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bouwmateriaal_winkels")
    .insert({
      naam: input.naam.trim(),
      categorie: input.categorie || "dak",
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

  revalidatePath("/bouwmaterialen");
  return { id: data.id as number };
}

/**
 * Uploadt foto's voor een bouwmaterialenwinkel naar de publieke bucket
 * `bouwmaterialen-media` (map <winkel_id>/...) en zet de publieke URL's op
 * bouwmateriaal_winkels.fotos. Geen login vereist.
 */
export async function uploadBouwmateriaalWinkelFotos(
  winkelId: number,
  formData: FormData,
) {
  const supabase = await createClient();

  const { data: winkel } = await supabase
    .from("bouwmateriaal_winkels")
    .select("id, fotos")
    .eq("id", winkelId)
    .maybeSingle();

  if (!winkel) return { error: "Deze winkel bestaat niet (meer)." };

  const files = formData
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) return { urls: [] as string[] };
  if (files.length > MAX_FOTOS) {
    return { error: `Maximaal ${MAX_FOTOS} foto's per winkel.` };
  }

  const urls: string[] = [];
  for (const file of files) {
    if (file.size > MAX_FOTO_BYTES) {
      return { error: `"${file.name}" is te groot (max. 10 MB).` };
    }
    const path = `${winkelId}/${Date.now()}-${slugify(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(BOUWMATERIALEN_MEDIA_BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
    if (uploadError) {
      return { error: `Uploaden mislukt: ${uploadError.message}` };
    }
    const { data: pub } = supabase.storage
      .from(BOUWMATERIALEN_MEDIA_BUCKET)
      .getPublicUrl(path);
    urls.push(pub.publicUrl);
  }

  const existing = (winkel.fotos ?? []) as string[];
  const { error: updateError } = await supabase
    .from("bouwmateriaal_winkels")
    .update({ fotos: [...existing, ...urls] })
    .eq("id", winkelId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/bouwmaterialen");
  return { urls };
}
