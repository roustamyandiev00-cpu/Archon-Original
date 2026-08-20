"use server";

import { revalidatePath } from "next/cache";
import { getCompanyContext } from "@/lib/company";
import { requireWriteAccess } from "@/components/dashboard/context";

export type ProjectBestandCategory =
  | "foto"
  | "offerte_foto"
  | "document"
  | "plan"
  | "contract"
  | "andere";

export type ProjectBestandRow = {
  id: string;
  project_id: string | null;
  offerte_id: number | null;
  customer_id: number | null;
  category: ProjectBestandCategory;
  file_name: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_bucket: string;
  storage_path: string;
  created_at: string;
  url?: string | null;
};

const BUCKET = "project-files";
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_FILES = 20;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);

const DOC_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]);

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w.\- ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60) || "bestand";

function inferCategory(
  mime: string,
  preferred?: ProjectBestandCategory,
): ProjectBestandCategory {
  if (preferred) return preferred;
  if (IMAGE_TYPES.has(mime)) return "foto";
  if (mime === "application/pdf") return "document";
  return "document";
}

function isAllowedMime(mime: string) {
  return IMAGE_TYPES.has(mime) || DOC_TYPES.has(mime) || mime.startsWith("image/");
}

async function signedUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  path: string,
  bucket = BUCKET,
) {
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function listProjectBestanden(projectId: string) {
  const { supabase, companyId } = await getCompanyContext();
  if (!companyId) return { error: "Geen bedrijf.", bestanden: [] as ProjectBestandRow[] };

  const { data, error } = await supabase
    .from("project_bestanden")
    .select(
      "id, project_id, offerte_id, customer_id, category, file_name, original_name, mime_type, size_bytes, storage_bucket, storage_path, created_at",
    )
    .eq("company_id", companyId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, bestanden: [] as ProjectBestandRow[] };

  const bestanden: ProjectBestandRow[] = [];
  for (const row of data ?? []) {
    const url = await signedUrl(
      supabase,
      row.storage_path,
      row.storage_bucket || BUCKET,
    );
    bestanden.push({ ...(row as ProjectBestandRow), url });
  }

  return { bestanden };
}

export async function uploadProjectBestanden(input: {
  projectId?: string | null;
  offerteId?: number | null;
  customerId?: number | null;
  category?: ProjectBestandCategory;
  formData: FormData;
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  if (!input.projectId && !input.offerteId && !input.customerId) {
    return { error: "Project, offerte of klant is verplicht." };
  }

  if (input.projectId) {
    const { data: project } = await supabase
      .from("projecten")
      .select("id, customer_id, offerte_id")
      .eq("id", input.projectId)
      .eq("bedrijf_id", companyId)
      .maybeSingle();
    if (!project) return { error: "Project niet gevonden." };
    if (!input.customerId && project.customer_id) {
      input.customerId = project.customer_id;
    }
    if (!input.offerteId && project.offerte_id) {
      input.offerteId = project.offerte_id;
    }
  }

  if (input.offerteId) {
    const { data: offerte } = await supabase
      .from("offertes")
      .select("id, customer_id")
      .eq("id", input.offerteId)
      .eq("bedrijf_id", companyId)
      .maybeSingle();
    if (!offerte) return { error: "Offerte niet gevonden." };
    if (!input.customerId && offerte.customer_id) {
      input.customerId = offerte.customer_id;
    }
  }

  const files = input.formData
    .getAll("bestanden")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) return { error: "Selecteer minstens één bestand." };
  if (files.length > MAX_FILES) {
    return { error: `Maximaal ${MAX_FILES} bestanden per keer.` };
  }

  const uploaded: { id: string; original_name: string }[] = [];

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      return { error: `${file.name} is groter dan 15 MB.` };
    }
    const mime = file.type || "application/octet-stream";
    if (!isAllowedMime(mime)) {
      return {
        error: `${file.name}: dit bestandstype is niet toegelaten (foto's of PDF/Office).`,
      };
    }

    const category = inferCategory(mime, input.category);
    const safeName = slugify(file.name);
    const stamp = Date.now();
    const folder = input.projectId
      ? `projects/${input.projectId}`
      : input.offerteId
        ? `offertes/${input.offerteId}`
        : `customers/${input.customerId ?? "algemeen"}`;
    const path = `${companyId}/${folder}/${stamp}-${safeName}`;

    const { error: upError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: mime, upsert: false });

    if (upError) return { error: upError.message };

    const { data: row, error: dbError } = await supabase
      .from("project_bestanden")
      .insert({
        company_id: companyId,
        project_id: input.projectId ?? null,
        offerte_id: input.offerteId ?? null,
        customer_id: input.customerId ?? null,
        category,
        file_name: safeName,
        original_name: file.name,
        mime_type: mime,
        size_bytes: file.size,
        storage_bucket: BUCKET,
        storage_path: path,
        uploaded_by: user.id,
      })
      .select("id")
      .single();

    if (dbError) {
      await supabase.storage.from(BUCKET).remove([path]);
      return { error: dbError.message };
    }

    // Spiegel naar customer_documents wanneer er een klant is
    if (input.customerId) {
      await supabase.from("customer_documents").insert({
        company_id: companyId,
        customer_id: input.customerId,
        document_type: category === "foto" || category === "offerte_foto" ? "photo" : "file",
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: mime,
        title: file.name,
        is_visible_in_portal: false,
      });
    }

    uploaded.push({ id: row.id as string, original_name: file.name });
  }

  if (input.projectId) {
    revalidatePath(`/dashboard/offertes/projecten/${input.projectId}`);
  }
  revalidatePath("/dashboard/offertes/projecten");
  if (input.offerteId) {
    revalidatePath(`/dashboard/offertes/${input.offerteId}`);
  }

  return { ok: true as const, uploaded };
}

/** Upload foto's als base64 (bv. vanuit Nova offerte-flow) en koppel aan offerte. */
export async function uploadOffertePhotosFromBase64(input: {
  offerteId: number;
  customerId?: number | null;
  photos: { name: string; dataUrl: string }[];
}) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  const { data: offerte } = await supabase
    .from("offertes")
    .select("id, customer_id, converted_to_type")
    .eq("id", input.offerteId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!offerte) return { error: "Offerte niet gevonden." };

  const customerId = input.customerId ?? offerte.customer_id;
  let projectId: string | null = null;
  const linked = offerte.converted_to_type;
  if (linked?.startsWith("project:")) {
    projectId = linked.slice("project:".length);
  }

  const uploaded: string[] = [];

  for (const photo of input.photos.slice(0, MAX_FILES)) {
    const match = photo.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) continue;
    const mime = match[1];
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.byteLength > MAX_BYTES) continue;
    if (!IMAGE_TYPES.has(mime) && !mime.startsWith("image/")) continue;

    const safeName = slugify(photo.name || "foto.jpg");
    const stamp = Date.now();
    const folder = projectId ? `projects/${projectId}` : `offertes/${input.offerteId}`;
    const path = `${companyId}/${folder}/${stamp}-${safeName}`;

    const { error: upError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: mime, upsert: false });
    if (upError) continue;

    const { error: dbError } = await supabase.from("project_bestanden").insert({
      company_id: companyId,
      project_id: projectId,
      offerte_id: input.offerteId,
      customer_id: customerId,
      category: "offerte_foto",
      file_name: safeName,
      original_name: photo.name || "foto.jpg",
      mime_type: mime,
      size_bytes: buffer.byteLength,
      storage_bucket: BUCKET,
      storage_path: path,
      uploaded_by: user.id,
    });

    if (dbError) {
      await supabase.storage.from(BUCKET).remove([path]);
      continue;
    }

    if (customerId) {
      await supabase.from("customer_documents").insert({
        company_id: companyId,
        customer_id: customerId,
        document_type: "photo",
        file_name: photo.name || "foto.jpg",
        file_path: path,
        file_size: buffer.byteLength,
        mime_type: mime,
        title: photo.name || "Offertefoto",
        is_visible_in_portal: false,
      });
    }

    uploaded.push(path);
  }

  revalidatePath(`/dashboard/offertes/${input.offerteId}`);
  if (projectId) {
    revalidatePath(`/dashboard/offertes/projecten/${projectId}`);
  }
  revalidatePath("/dashboard/offertes/projecten");

  return { ok: true as const, count: uploaded.length };
}

export async function deleteProjectBestand(id: string) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const { data: row } = await supabase
    .from("project_bestanden")
    .select("id, storage_path, storage_bucket, project_id")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!row) return { error: "Bestand niet gevonden." };

  await supabase.storage
    .from(row.storage_bucket || BUCKET)
    .remove([row.storage_path]);

  const { error } = await supabase
    .from("project_bestanden")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) return { error: error.message };

  if (row.project_id) {
    revalidatePath(`/dashboard/offertes/projecten/${row.project_id}`);
  }
  revalidatePath("/dashboard/offertes/projecten");
  return { ok: true as const };
}
