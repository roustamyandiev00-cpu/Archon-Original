"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireWriteAccess } from "@/components/dashboard/context";
import type { ImportEntity, ImportResult } from "@/components/dashboard/instellingen/import/types";
import { loadCompanyDefaultTemplate } from "@/components/dashboard/documenten/documentTemplate";
import { MAX_IMPORT_ROWS } from "@/components/dashboard/instellingen/import/parse";

const IMPORT_BUCKET = "documents";
const MAX_FILE_BYTES = 15 * 1024 * 1024;

type ImportPayload = {
  entity: ImportEntity;
  rows: Record<string, string>[];
  mapping: Record<string, string | null>;
  skipDuplicates: boolean;
  createMissingCustomers: boolean;
};

function num(v: string | undefined, fallback = 0) {
  if (!v?.trim()) return fallback;
  const n = Number(v.replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function parseDate(v: string | undefined, fallback?: string) {
  const raw = (v ?? "").trim();
  if (!raw) return fallback ?? new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const dmy = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dmy) {
    const y = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${y}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  const t = Date.parse(raw);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return fallback ?? new Date().toISOString().slice(0, 10);
}

function mapOfferteStatus(raw: string) {
  const s = raw.toLowerCase();
  if (s.includes("accept")) return "geaccepteerd";
  if (s.includes("reject") || s.includes("afgewezen")) return "afgewezen";
  if (s.includes("view") || s.includes("bekeken")) return "bekeken";
  if (s.includes("send") || s.includes("verzonden")) return "verzonden";
  return "concept";
}

function mapFactuurStatus(raw: string) {
  const s = raw.toLowerCase();
  if (s.includes("betaald") || s.includes("paid")) return "betaald";
  if (s.includes("verzonden") || s.includes("sent")) return "verzonden";
  return "concept";
}

function mapLeadStage(raw: string) {
  const s = raw.trim();
  if (!s) return "Nieuw";
  const known = [
    "Nieuw",
    "Gekwalificeerd",
    "Offerte verzonden",
    "Onderhandeling",
    "Gewonnen",
    "Verloren",
  ];
  const hit = known.find((k) => k.toLowerCase() === s.toLowerCase());
  return hit ?? s;
}

function mapRows(
  rows: Record<string, string>[],
  mapping: Record<string, string | null>,
) {
  return rows.map((row) => {
    const out: Record<string, string> = {};
    for (const [field, header] of Object.entries(mapping)) {
      if (!header) continue;
      out[field] = (row[header] ?? "").trim();
    }
    return out;
  });
}

async function findOrCreateCustomer(
  supabase: SupabaseClient,
  companyId: number,
  userId: string,
  input: {
    name: string;
    email?: string;
    phone?: string;
    createMissing: boolean;
    cache: Map<string, number>;
  },
): Promise<number | null> {
  const key = (input.email || input.name).toLowerCase();
  if (input.cache.has(key)) return input.cache.get(key)!;

  if (input.email) {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("company_id", companyId)
      .ilike("email", input.email)
      .limit(1)
      .maybeSingle();
    if (data?.id) {
      input.cache.set(key, data.id);
      return data.id;
    }
  }

  const { data: byName } = await supabase
    .from("customers")
    .select("id")
    .eq("company_id", companyId)
    .ilike("name", input.name)
    .limit(1)
    .maybeSingle();
  if (byName?.id) {
    input.cache.set(key, byName.id);
    return byName.id;
  }

  if (!input.createMissing) return null;

  const { data: created, error } = await supabase
    .from("customers")
    .insert({
      company_id: companyId,
      created_by: userId,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !created) return null;
  input.cache.set(key, created.id);
  return created.id;
}

export async function executeDataImport(
  payload: ImportPayload,
): Promise<ImportResult | { error: string }> {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId, user } = access;

  if (!payload.entity) return { error: "Kies wat je wilt importeren." };
  if (!payload.rows?.length) return { error: "Geen rijen om te importeren." };
  if (payload.rows.length > MAX_IMPORT_ROWS) {
    return {
      error: `Maximaal ${MAX_IMPORT_ROWS} rijen per import. Splits je bestand.`,
    };
  }

  const mapped = mapRows(payload.rows, payload.mapping);
  let imported = 0;
  let skipped = 0;
  let createdCustomers = 0;
  const errors: string[] = [];
  const customerCache = new Map<string, number>();
  const now = new Date().toISOString();
  const quoteTemplate = await loadCompanyDefaultTemplate(
    supabase,
    companyId,
    "quote",
  );
  const invoiceTemplate = await loadCompanyDefaultTemplate(
    supabase,
    companyId,
    "invoice",
  );

  if (payload.entity === "customers") {
    for (let i = 0; i < mapped.length; i++) {
      const row = mapped[i];
      const name =
        row.name?.trim() ||
        [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
        row.company_name?.trim();
      if (!name) {
        skipped++;
        errors.push(`Rij ${i + 1}: geen naam.`);
        continue;
      }

      if (payload.skipDuplicates) {
        const { data: dup } = row.email
          ? await supabase
              .from("customers")
              .select("id")
              .eq("company_id", companyId)
              .ilike("email", row.email)
              .limit(1)
              .maybeSingle()
          : await supabase
              .from("customers")
              .select("id")
              .eq("company_id", companyId)
              .ilike("name", name)
              .limit(1)
              .maybeSingle();
        if (dup) {
          skipped++;
          continue;
        }
      }

      const kbo =
        row.ondernemingsnummer?.trim() || row.kvk?.trim() || null;

      const { error } = await supabase.from("customers").insert({
        company_id: companyId,
        created_by: user.id,
        name,
        company_name: row.company_name || null,
        first_name: row.first_name || null,
        last_name: row.last_name || null,
        email: row.email || null,
        phone: row.phone || null,
        address: row.address || null,
        postcode: row.postcode || null,
        city: row.city || null,
        country: row.country?.trim() || "BE",
        ondernemingsnummer: kbo,
        kvk: kbo,
        btw: row.btw || null,
        peppol_participant_id: row.peppol_participant_id || null,
        notes: row.notes || null,
        is_active: true,
      });

      if (error) {
        skipped++;
        errors.push(`Rij ${i + 1}: ${error.message}`);
      } else {
        imported++;
      }
    }
  }

  if (payload.entity === "offertes") {
    const year = new Date().getFullYear();
    let seq = 1;
    const { data: laatste } = await supabase
      .from("offertes")
      .select("nummer")
      .eq("bedrijf_id", companyId)
      .like("nummer", `OFF-${year}-%`)
      .order("nummer", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (laatste?.nummer) {
      const m = String(laatste.nummer).match(/(\d+)\s*$/);
      if (m) seq = parseInt(m[1], 10) + 1;
    }

    for (let i = 0; i < mapped.length; i++) {
      const row = mapped[i];
      const klant = row.klant?.trim();
      const bedrag = num(row.bedrag);
      if (!klant || bedrag <= 0) {
        skipped++;
        errors.push(`Rij ${i + 1}: klant of bedrag ontbreekt.`);
        continue;
      }

      if (payload.skipDuplicates && row.nummer) {
        const { data: dup } = await supabase
          .from("offertes")
          .select("id")
          .eq("bedrijf_id", companyId)
          .eq("nummer", row.nummer)
          .maybeSingle();
        if (dup) {
          skipped++;
          continue;
        }
      }

      const before = customerCache.size;
      const customerId = await findOrCreateCustomer(supabase, companyId, user.id, {
        name: klant,
        email: row.klant_email,
        createMissing: payload.createMissingCustomers,
        cache: customerCache,
      });
      if (customerCache.size > before) createdCustomers++;

      const statusNew = mapOfferteStatus(row.status ?? "");
      const nummer =
        row.nummer?.trim() || `OFF-${year}-${String(seq++).padStart(4, "0")}`;

      const { data: offerte, error } = await supabase
        .from("offertes")
        .insert({
          nummer,
          klant,
          customer_id: customerId,
          bedrijf_id: companyId,
          user_id: user.id,
          bedrag,
          datum: parseDate(row.datum),
          geldig_tot: row.geldig_tot ? parseDate(row.geldig_tot) : null,
          notes: row.notes || null,
          status: statusNew === "concept" ? "Concept" : "Verzonden",
          status_new: statusNew,
          template_id: quoteTemplate,
        })
        .select("id")
        .single();

      if (error || !offerte) {
        skipped++;
        errors.push(`Rij ${i + 1}: ${error?.message ?? "import mislukt"}`);
        continue;
      }

      const btwPct = 21;
      const excl = bedrag / (1 + btwPct / 100);
      await supabase.from("offerte_lijnen").insert({
        offerte_id: offerte.id,
        company_id: companyId,
        omschrijving: row.notes?.trim() || "Geïmporteerd uit extern CRM",
        aantal: 1,
        eenheid: "stuks",
        prijs_per_eenheid: excl,
        btw_percentage: btwPct,
        sort_order: 0,
      });
      imported++;
    }
  }

  if (payload.entity === "facturen") {
    const year = new Date().getFullYear();
    let seq = 1;
    const { data: laatste } = await supabase
      .from("facturen")
      .select("nummer")
      .eq("bedrijf_id", companyId)
      .eq("document_type", "factuur")
      .like("nummer", `FAC-${year}-%`)
      .order("nummer", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (laatste?.nummer) {
      const m = String(laatste.nummer).match(/(\d+)\s*$/);
      if (m) seq = parseInt(m[1], 10) + 1;
    }

    for (let i = 0; i < mapped.length; i++) {
      const row = mapped[i];
      const klant = row.klant?.trim();
      const totaal = num(row.bedrag);
      if (!klant || totaal <= 0) {
        skipped++;
        errors.push(`Rij ${i + 1}: klant of bedrag ontbreekt.`);
        continue;
      }

      const docType = (row.document_type ?? "factuur").toLowerCase();
      const documentType =
        docType.includes("pro") || docType.includes("proforma")
          ? "proforma"
          : "factuur";

      if (payload.skipDuplicates && row.nummer) {
        const { data: dup } = await supabase
          .from("facturen")
          .select("id")
          .eq("bedrijf_id", companyId)
          .eq("nummer", row.nummer)
          .maybeSingle();
        if (dup) {
          skipped++;
          continue;
        }
      }

      const before = customerCache.size;
      const customerId = await findOrCreateCustomer(supabase, companyId, user.id, {
        name: klant,
        email: row.klant_email,
        createMissing: payload.createMissingCustomers,
        cache: customerCache,
      });
      if (customerCache.size > before) createdCustomers++;

      const status = mapFactuurStatus(row.status ?? "");
      const prefix = documentType === "proforma" ? "PRO" : "FAC";
      const nummer =
        row.nummer?.trim() || `${prefix}-${year}-${String(seq++).padStart(4, "0")}`;
      const btwPct = 21;
      const subtotaal = totaal / (1 + btwPct / 100);
      const btw = totaal - subtotaal;

      const { data: factuur, error } = await supabase
        .from("facturen")
        .insert({
          nummer,
          klant,
          customer_id: customerId,
          bedrijf_id: companyId,
          user_id: user.id,
          document_type: documentType,
          bedrag: subtotaal,
          btw_bedrag: btw,
          totaal_bedrag: totaal,
          datum: parseDate(row.datum),
          vervaldatum: row.vervaldatum ? parseDate(row.vervaldatum) : null,
          omschrijving: row.omschrijving || null,
          status,
          paid_at: status === "betaald" ? now : null,
          template_id: invoiceTemplate,
        })
        .select("id")
        .single();

      if (error || !factuur) {
        skipped++;
        errors.push(`Rij ${i + 1}: ${error?.message ?? "import mislukt"}`);
        continue;
      }

      await supabase.from("factuur_lijnen").insert({
        factuur_id: factuur.id,
        company_id: companyId,
        omschrijving: row.omschrijving?.trim() || "Geïmporteerd uit extern CRM",
        aantal: 1,
        eenheid: "stuks",
        prijs_per_eenheid: subtotaal,
        btw_percentage: btwPct,
        sort_order: 0,
      });
      imported++;
    }
  }

  if (payload.entity === "leads") {
    for (let i = 0; i < mapped.length; i++) {
      const row = mapped[i];
      const titelBase = row.titel?.trim();
      if (!titelBase) {
        skipped++;
        errors.push(`Rij ${i + 1}: titel ontbreekt.`);
        continue;
      }
      const titel = row.klant?.trim()
        ? `${titelBase} — ${row.klant.trim()}`
        : titelBase;

      const { error } = await supabase.from("deals").insert({
        bedrijf_id: companyId,
        user_id: user.id,
        titel,
        stadium: mapLeadStage(row.stadium ?? ""),
        waarde: num(row.waarde),
        kans: Math.min(100, Math.max(0, num(row.kans, 50))),
        deadline: row.deadline ? parseDate(row.deadline) : null,
      });

      if (error) {
        skipped++;
        errors.push(`Rij ${i + 1}: ${error.message}`);
      } else {
        imported++;
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/contacten");
  revalidatePath("/dashboard/offertes");
  revalidatePath("/dashboard/facturen");
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/instellingen");

  return {
    ok: true,
    imported,
    skipped,
    errors: errors.slice(0, 12),
    createdCustomers,
  };
}

export async function storeImportFile(formData: FormData) {
  const access = await requireWriteAccess();
  if ("error" in access) return { error: access.error };
  const { supabase, companyId } = access;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Geen bestand gekozen." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "Bestand is te groot (max. 15 MB)." };
  }

  const path = `imports/${companyId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  const { error } = await supabase.storage.from(IMPORT_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });

  if (error) return { error: error.message };
  return { path };
}
