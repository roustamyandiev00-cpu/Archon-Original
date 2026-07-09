/** Belgische Peppol / EN16931 hulpfuncties. */

/** Alleen cijfers uit een string. */
export function digitsOnly(v: string | null | undefined): string {
  return String(v ?? "").replace(/\D/g, "");
}

/** Normaliseer KBO/BCE (10 cijfers). */
export function normalizeKbo(v: string | null | undefined): string | null {
  const d = digitsOnly(v);
  if (d.length === 9) return `0${d}`;
  if (d.length === 10) return d;
  return null;
}

/** Normaliseer Belgisch BTW-nummer naar BE0XXXXXXXXX. */
export function normalizeBelgianVat(v: string | null | undefined): string | null {
  const raw = String(v ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!raw) return null;
  const withoutPrefix = raw.startsWith("BE") ? raw.slice(2) : raw;
  const d = digitsOnly(withoutPrefix);
  if (d.length === 9) return `BE0${d}`;
  if (d.length === 10 && d.startsWith("0")) return `BE${d}`;
  if (d.length === 10) return `BE0${d}`;
  return raw.startsWith("BE") ? raw : null;
}

/**
 * Bouw Peppol EndpointID uit scheme:value of afleiden uit KBO/BTW.
 * Belgische voorkeur: 0208 (KBO) voor binnenlandse B2B.
 */
export function peppolEndpointFromParty(input: {
  peppolParticipantId?: string | null;
  kbo?: string | null;
  vat?: string | null;
}): { scheme: string; value: string } | null {
  const explicit = (input.peppolParticipantId ?? "").trim();
  if (explicit) {
    const idx = explicit.indexOf(":");
    if (idx > 0) {
      return {
        scheme: explicit.slice(0, idx).trim(),
        value: explicit.slice(idx + 1).trim(),
      };
    }
    const kbo = normalizeKbo(explicit);
    if (kbo) return { scheme: "0208", value: kbo };
  }

  const kbo = normalizeKbo(input.kbo);
  if (kbo) return { scheme: "0208", value: kbo };

  const vat = normalizeBelgianVat(input.vat);
  if (vat) return { scheme: "9925", value: vat };

  return null;
}

/** Standaard leverancier-Peppol-ID afleiden uit bedrijfsgegevens. */
export function defaultSupplierPeppolId(bedrijf: {
  peppol_participant_id?: string | null;
  kvk?: string | null;
  btw?: string | null;
}): string | null {
  const ep = peppolEndpointFromParty({
    peppolParticipantId: bedrijf.peppol_participant_id,
    kbo: bedrijf.kvk,
    vat: bedrijf.btw,
  });
  if (!ep) return null;
  return `${ep.scheme}:${ep.value}`;
}

/** Valideer Belgische gestructureerde mededeling (+++xxx/xxxx/xxxxx+++). */
export function isValidStructuredCommunication(v: string | null | undefined): boolean {
  const raw = String(v ?? "").trim();
  if (!raw) return true;
  return /^\+\+\+\d{3}\/\d{4}\/\d{5}\+\+\+$/.test(raw.replace(/\s/g, ""));
}

/** Normaliseer gestructureerde mededeling. */
export function normalizeStructuredCommunication(
  v: string | null | undefined,
): string | null {
  const raw = String(v ?? "").trim().replace(/\s/g, "");
  if (!raw) return null;
  if (isValidStructuredCommunication(raw)) return raw;
  const d = digitsOnly(raw);
  if (d.length === 12) {
    return `+++${d.slice(0, 3)}/${d.slice(3, 7)}/${d.slice(7, 12)}+++`;
  }
  return raw;
}
