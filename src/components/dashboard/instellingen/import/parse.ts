import { COLUMN_ALIASES, ENTITY_FIELDS } from "./fields";
import type {
  CrmPreset,
  ImportEntity,
  ImportMapping,
  ImportPreviewRow,
  ParsedImportFile,
} from "./types";

const MAX_ROWS = 500;

function normalizeHeader(h: string) {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function detectDelimiter(line: string): "," | ";" | "\t" {
  const counts = {
    ",": (line.match(/,/g) ?? []).length,
    ";": (line.match(/;/g) ?? []).length,
    "\t": (line.match(/\t/g) ?? []).length,
  };
  if (counts[";"] >= counts[","] && counts[";"] >= counts["\t"]) return ";";
  if (counts["\t"] >= counts[","]) return "\t";
  return ",";
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseImportFile(
  text: string,
  fileName: string,
): ParsedImportFile | { error: string } {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) return { error: "Bestand is leeg." };

  const lower = fileName.toLowerCase();

  if (lower.endsWith(".json")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const list = Array.isArray(parsed)
        ? parsed
        : parsed &&
            typeof parsed === "object" &&
            Array.isArray((parsed as { data?: unknown[] }).data)
          ? (parsed as { data: unknown[] }).data
          : null;
      if (!list) {
        return {
          error: "JSON moet een array zijn of { \"data\": [...] } bevatten.",
        };
      }
      const objects = list.filter(
        (row): row is Record<string, unknown> =>
          !!row && typeof row === "object" && !Array.isArray(row),
      );
      if (objects.length === 0) return { error: "Geen rijen gevonden in JSON." };

      const headerSet = new Set<string>();
      for (const obj of objects.slice(0, 50)) {
        Object.keys(obj).forEach((k) => headerSet.add(k));
      }
      const headers = [...headerSet];
      const rows = objects.slice(0, MAX_ROWS).map((obj) => {
        const row: Record<string, string> = {};
        for (const h of headers) {
          const v = obj[h];
          row[h] =
            v === null || v === undefined
              ? ""
              : typeof v === "object"
                ? JSON.stringify(v)
                : String(v);
        }
        return row;
      });

      return { headers, rows, format: "json" };
    } catch {
      return { error: "Ongeldige JSON." };
    }
  }

  const delimiter =
    lower.endsWith(".tsv") || lower.endsWith(".txt")
      ? "\t"
      : detectDelimiter(trimmed.split(/\r?\n/)[0] ?? "");

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) {
    return { error: "CSV moet een headerrij en minstens één datarij bevatten." };
  }

  const headers = parseCsvLine(lines[0], delimiter);
  const rows = lines.slice(1, MAX_ROWS + 1).map((line) => {
    const cells = parseCsvLine(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });

  return {
    headers,
    rows,
    format: delimiter === "\t" ? "tsv" : "csv",
  };
}

export function autoMapColumns(
  headers: string[],
  entity: ImportEntity,
  preset: CrmPreset,
): ImportMapping {
  const fields = ENTITY_FIELDS[entity];
  const aliases =
    COLUMN_ALIASES[entity][preset] ??
    COLUMN_ALIASES[entity].generic ??
    {};

  const mapping: ImportMapping = {};
  for (const field of fields) {
    mapping[field.key] = null;
  }

  const normalizedHeaders = headers.map((h) => ({
    raw: h,
    norm: normalizeHeader(h),
  }));

  for (const field of fields) {
    const direct = normalizedHeaders.find(
      (h) => h.norm === field.key || h.norm.replace(/\s+/g, "_") === field.key,
    );
    if (direct) {
      mapping[field.key] = direct.raw;
      continue;
    }

    for (const [alias, target] of Object.entries(aliases)) {
      if (target !== field.key) continue;
      const match = normalizedHeaders.find((h) => h.norm === alias);
      if (match && !Object.values(mapping).includes(match.raw)) {
        mapping[field.key] = match.raw;
        break;
      }
    }
  }

  return mapping;
}

export function mapRow(
  row: Record<string, string>,
  mapping: ImportMapping,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, header] of Object.entries(mapping)) {
    if (!header) continue;
    out[field] = (row[header] ?? "").trim();
  }
  return out;
}

export function countValidRows(
  rows: Record<string, string>[],
  entity: ImportEntity,
  mapping: ImportMapping,
): number {
  const required = new Set(
    ENTITY_FIELDS[entity].filter((f) => f.required).map((f) => f.key),
  );
  let count = 0;
  for (const row of rows) {
    const values = mapRow(row, mapping);
    const ok = [...required].every((key) => values[key]?.trim());
    if (ok) count++;
  }
  return count;
}

export function buildPreview(
  rows: Record<string, string>[],
  entity: ImportEntity,
  mapping: ImportMapping,
): ImportPreviewRow[] {
  const required = new Set(
    ENTITY_FIELDS[entity].filter((f) => f.required).map((f) => f.key),
  );

  return rows.slice(0, 8).map((row, index) => {
    const values = mapRow(row, mapping);
    const issues: string[] = [];
    for (const key of required) {
      if (!values[key]?.trim()) issues.push(`Ontbrekend: ${key}`);
    }
    return {
      index,
      values,
      valid: issues.length === 0,
      issues,
    };
  });
}

export const IMPORT_ACCEPT =
  ".csv,.tsv,.txt,.json,text/csv,application/json,text/tab-separated-values";

export const MAX_IMPORT_ROWS = MAX_ROWS;
