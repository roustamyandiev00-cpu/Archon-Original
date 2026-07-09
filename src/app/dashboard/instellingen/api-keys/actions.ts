"use server";

import { revalidatePath } from "next/cache";
import { getCompanyContext } from "@/lib/company";
import { generateApiKey } from "@/lib/apiKeys";
import { sanitizeScopes } from "@/lib/apiResources";

export async function createApiKey(
  name: string,
  scopes: string[] = [],
): Promise<{ error: string } | { id: string; rawKey: string; keyPrefix: string }> {
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) {
    return { error: "Geen actief bedrijf gevonden voor je account." };
  }

  const clean = name.trim().slice(0, 60) || "API-sleutel";
  const cleanScopes = sanitizeScopes(scopes);
  const { raw, hash, prefix } = generateApiKey();

  const { data, error } = await supabase
    .from("company_api_keys")
    .insert({
      company_id: companyId,
      name: clean,
      key_prefix: prefix,
      key_hash: hash,
      scopes: cleanScopes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/instellingen");
  return { id: data.id, rawKey: raw, keyPrefix: prefix };
}

export async function revokeApiKey(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const { supabase, user, companyId } = await getCompanyContext();
  if (!user || !companyId) return { error: "Niet ingelogd." };

  const { error } = await supabase
    .from("company_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId)
    .is("revoked_at", null);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/instellingen");
  return { success: true };
}
