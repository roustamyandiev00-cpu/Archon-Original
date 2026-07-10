import {
  normalizeBelgianVat,
  normalizeKbo,
} from "@/lib/peppol/be";

export type CompanyLookupResult = {
  name: string;
  btw: string;
  ondernemingsnummer: string;
  address: string;
  street: string;
  postcode: string;
  city: string;
  country: string;
};

export function vatDigitsForLookup(vat: string): string | null {
  const normalized = normalizeBelgianVat(vat);
  if (!normalized) return null;
  return normalized.slice(2);
}

export function kboFromVat(vat: string): string | null {
  return normalizeKbo(vatDigitsForLookup(vat));
}

export function parseBelgianViesAddress(address: string): {
  street: string;
  postcode: string;
  city: string;
} {
  const lines = address
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { street: "", postcode: "", city: "" };
  }

  const street = lines.length > 1 ? lines.slice(0, -1).join(", ") : lines[0];
  const last = lines[lines.length - 1];
  const match = last.match(/^(\d{4})\s+(.+)$/);

  if (match) {
    return {
      street: lines.length > 1 ? street : "",
      postcode: match[1],
      city: match[2],
    };
  }

  return { street: lines.join(", "), postcode: "", city: "" };
}

export function shouldLookupCompany(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9;
}
