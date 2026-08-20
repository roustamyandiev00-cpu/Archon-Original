import { createHash } from "crypto";
import { normalizeStructuredCommunication } from "@/lib/peppol/be";

export type ParsedBankLine = {
  datum: string;
  bedrag: number;
  tegenpartij: string | null;
  omschrijving: string | null;
  gestructureerde_mededeling: string | null;
  extern_referentie: string;
};

function hashRef(parts: string[]) {
  return createHash("sha256").update(parts.join("|"), "utf8").digest("hex").slice(0, 40);
}

function parseEuropeanDate(raw: string): string | null {
  const t = raw.trim();
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const eu = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (eu) {
    const y = eu[3].length === 2 ? `20${eu[3]}` : eu[3];
    return `${y}-${eu[2].padStart(2, "0")}-${eu[1].padStart(2, "0")}`;
  }
  return null;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function extractStructuredCommunication(text: string): string | null {
  const ogm = text.match(/\+{3}[\d/]+\+{3}/);
  if (ogm) return normalizeStructuredCommunication(ogm[0]);
  const digits = text.replace(/\D/g, "");
  if (digits.length >= 10) {
    return normalizeStructuredCommunication(digits.slice(0, 12));
  }
  return null;
}

/** Parseert CSV-export van Belgische banken (generiek). */
export function parseBankCsv(content: string): ParsedBankLine[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

  const dateIdx = headers.findIndex((h) =>
    /^(datum|date|booking|boekingsdatum|transaction date)/.test(h),
  );
  const amountIdx = headers.findIndex((h) =>
    /^(bedrag|amount|montant|credit|debet|amount \(eur\))/.test(h),
  );
  const descIdx = headers.findIndex((h) =>
    /^(omschrijving|description|mededeling|communication|details)/.test(h),
  );
  const partyIdx = headers.findIndex((h) =>
    /^(tegenpartij|counterparty|naam|name|beneficiary)/.test(h),
  );

  if (dateIdx < 0 || amountIdx < 0) return [];

  const rows: ParsedBankLine[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter);
    const datum = parseEuropeanDate(cols[dateIdx] ?? "");
    const bedrag = parseAmount(cols[amountIdx] ?? "");
    if (!datum || bedrag == null) continue;

    const omschrijving = descIdx >= 0 ? cols[descIdx]?.trim() || null : null;
    const tegenpartij = partyIdx >= 0 ? cols[partyIdx]?.trim() || null : null;
    const mededeling =
      extractStructuredCommunication(
        [omschrijving, tegenpartij, lines[i]].filter(Boolean).join(" "),
      ) ?? null;

    rows.push({
      datum,
      bedrag,
      tegenpartij,
      omschrijving,
      gestructureerde_mededeling: mededeling,
      extern_referentie: hashRef([
        datum,
        String(bedrag),
        tegenpartij ?? "",
        omschrijving ?? "",
      ]),
    });
  }
  return rows;
}

/** Parseert CAMT.053 XML (vereenvoudigd). */
export function parseCamt053(xml: string): ParsedBankLine[] {
  const rows: ParsedBankLine[] = [];
  const entries = xml.match(/<Ntry>[\s\S]*?<\/Ntry>/gi) ?? [];

  for (const entry of entries) {
    const datum =
      entry.match(/<BookgDt>[\s\S]*?<Dt>([^<]+)<\/Dt>/i)?.[1] ??
      entry.match(/<ValDt>[\s\S]*?<Dt>([^<]+)<\/Dt>/i)?.[1];
    const amountRaw = entry.match(/<Amt[^>]*>([^<]+)<\/Amt>/i)?.[1];
    const creditDebit = entry.match(/<CdtDbtInd>([^<]+)</i)?.[1]?.toUpperCase();
    if (!datum || !amountRaw) continue;

    let bedrag = parseAmount(amountRaw);
    if (bedrag == null) continue;
    if (creditDebit === "DBIT") bedrag = -Math.abs(bedrag);

    const omschrijving =
      entry.match(/<Ustrd>([^<]*)<\/Ustrd>/i)?.[1]?.trim() || null;
    const tegenpartij =
      entry.match(/<Nm>([^<]*)<\/Nm>/i)?.[1]?.trim() || null;
    const mededeling =
      entry.match(/<EndToEndId>([^<]*)<\/EndToEndId>/i)?.[1]?.trim() ||
      extractStructuredCommunication(entry) ||
      null;

    const isoDate = parseEuropeanDate(datum);
    if (!isoDate) continue;

    rows.push({
      datum: isoDate,
      bedrag,
      tegenpartij,
      omschrijving,
      gestructureerde_mededeling: mededeling
        ? normalizeStructuredCommunication(mededeling)
        : null,
      extern_referentie: hashRef([
        isoDate,
        String(bedrag),
        tegenpartij ?? "",
        omschrijving ?? "",
        entry.slice(0, 80),
      ]),
    });
  }

  return rows;
}

export function parseBankStatement(
  fileName: string,
  content: string,
): ParsedBankLine[] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".xml") || content.includes("<Document")) {
    return parseCamt053(content);
  }
  return parseBankCsv(content);
}
