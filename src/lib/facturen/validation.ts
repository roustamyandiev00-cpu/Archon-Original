import type { FactuurDocumentType } from "@/lib/facturen";
import { lineTotals, type OfferteLijnInput } from "@/lib/offertes";

const DOCUMENT_TYPES = new Set<FactuurDocumentType>([
  "factuur",
  "proforma",
  "credit_nota",
]);

const PAYABLE_STATUSES = new Set([
  "verzonden",
  "herinnerd",
  "vervallen",
  "deels_betaald",
]);

export type ValidatedCreateFactuurInput = {
  documentType: FactuurDocumentType;
  customerId: number | null;
  projectId: string | null;
  klant: string;
  datum: string;
  vervaldatum: string | null;
  omschrijving: string;
  notities: string;
  lines: OfferteLijnInput[];
  totals: ReturnType<typeof lineTotals>;
};

type ValidationResult =
  | { ok: true; value: ValidatedCreateFactuurInput }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateCreateFactuurInput(
  input: unknown,
): ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: "Ongeldige factuurgegevens." };
  }
  if (
    typeof input.documentType !== "string" ||
    !DOCUMENT_TYPES.has(input.documentType as FactuurDocumentType)
  ) {
    return { ok: false, error: "Ongeldig documenttype." };
  }

  if (
    input.customerId !== null &&
    (!Number.isInteger(input.customerId) || Number(input.customerId) <= 0)
  ) {
    return { ok: false, error: "Ongeldige klant." };
  }

  if (
    input.projectId !== null &&
    input.projectId !== undefined &&
    (typeof input.projectId !== "string" || input.projectId.trim() === "")
  ) {
    return { ok: false, error: "Ongeldig project." };
  }

  if (typeof input.klant !== "string" || input.klant.trim() === "") {
    return { ok: false, error: "Klantnaam is verplicht." };
  }
  if (!isIsoDate(input.datum)) {
    return { ok: false, error: "Ongeldige factuurdatum." };
  }
  if (input.vervaldatum !== null && !isIsoDate(input.vervaldatum)) {
    return { ok: false, error: "Ongeldige vervaldatum." };
  }
  if (typeof input.omschrijving !== "string" || typeof input.notities !== "string") {
    return { ok: false, error: "Ongeldige factuurgegevens." };
  }
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    return { ok: false, error: "Voeg minstens één factuurlijn toe." };
  }

  const lines: OfferteLijnInput[] = [];
  for (const [index, rawLine] of input.lines.entries()) {
    if (!isRecord(rawLine)) {
      return { ok: false, error: `Factuurlijn ${index + 1} is ongeldig.` };
    }

    const omschrijving = rawLine.omschrijving;
    const aantal = rawLine.aantal;
    const eenheid = rawLine.eenheid;
    const prijs = rawLine.prijs_per_eenheid;
    const btw = rawLine.btw_percentage;

    if (typeof omschrijving !== "string" || omschrijving.trim() === "") {
      return {
        ok: false,
        error: `Omschrijving bij factuurlijn ${index + 1} is verplicht.`,
      };
    }
    if (typeof aantal !== "number" || !Number.isFinite(aantal) || aantal <= 0) {
      return { ok: false, error: `Aantal bij factuurlijn ${index + 1} is ongeldig.` };
    }
    if (typeof prijs !== "number" || !Number.isFinite(prijs) || prijs < 0) {
      return { ok: false, error: `Prijs bij factuurlijn ${index + 1} is ongeldig.` };
    }
    if (typeof btw !== "number" || !Number.isFinite(btw) || btw < 0 || btw > 100) {
      return { ok: false, error: `Btw bij factuurlijn ${index + 1} is ongeldig.` };
    }
    if (typeof eenheid !== "string") {
      return { ok: false, error: `Eenheid bij factuurlijn ${index + 1} is ongeldig.` };
    }

    lines.push({
      omschrijving: omschrijving.trim(),
      aantal,
      eenheid: eenheid.trim() || "stuks",
      prijs_per_eenheid: prijs,
      btw_percentage: btw,
    });
  }

  const totals = lineTotals(lines);
  if (
    !Number.isFinite(totals.subtotaal) ||
    !Number.isFinite(totals.btw) ||
    !Number.isFinite(totals.totaal) ||
    totals.subtotaal < 0 ||
    totals.btw < 0 ||
    totals.totaal < 0
  ) {
    return { ok: false, error: "De factuurbedragen zijn ongeldig." };
  }

  return {
    ok: true,
    value: {
      documentType: input.documentType as FactuurDocumentType,
      customerId: input.customerId as number | null,
      projectId:
        typeof input.projectId === "string" ? input.projectId.trim() : null,
      klant: input.klant.trim(),
      datum: input.datum,
      vervaldatum: input.vervaldatum,
      omschrijving: input.omschrijving.trim(),
      notities: input.notities.trim(),
      lines,
      totals,
    },
  };
}

export function isAllowedFactuurStatusTransition({
  documentType,
  currentStatus,
  nextStatus,
}: {
  documentType: string | null;
  currentStatus: string | null;
  nextStatus: "verzonden" | "betaald";
}) {
  if (
    typeof documentType !== "string" ||
    !DOCUMENT_TYPES.has(documentType as FactuurDocumentType)
  ) {
    return false;
  }
  if (documentType === "proforma") return false;
  if (nextStatus === "verzonden") return currentStatus === "concept";
  return PAYABLE_STATUSES.has(currentStatus ?? "");
}
