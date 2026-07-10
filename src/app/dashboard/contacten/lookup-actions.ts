"use server";

import {
  kboFromVat,
  parseBelgianViesAddress,
  type CompanyLookupResult,
  vatDigitsForLookup,
} from "@/components/dashboard/contacten/companyLookup";
import { normalizeBelgianVat, normalizeKbo } from "@/lib/peppol/be";

type ViesResponse = {
  valid?: boolean;
  name?: string;
  address?: string;
  userError?: string;
};

export async function lookupBelgianCompany(
  vatOrKbo: string,
): Promise<{ ok: true; data: CompanyLookupResult } | { error: string }> {
  const trimmed = vatOrKbo.trim();
  if (!trimmed) return { error: "Vul een BTW- of KBO-nummer in." };

  const kboDirect = normalizeKbo(trimmed);
  const vatDigits = vatDigitsForLookup(trimmed) ?? kboDirect;
  if (!vatDigits) {
    return { error: "Ongeldig Belgisch BTW- of KBO-nummer." };
  }

  try {
    const res = await fetch(
      "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          countryCode: "BE",
          vatNumber: vatDigits,
        }),
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return { error: "Bedrijfsregister tijdelijk niet bereikbaar. Probeer later opnieuw." };
    }

    const json = (await res.json()) as ViesResponse;
    if (!json.valid || !json.name?.trim()) {
      return {
        error:
          "Geen bedrijf gevonden voor dit nummer. Controleer het BTW- of KBO-nummer.",
      };
    }

    const parsed = parseBelgianViesAddress(json.address ?? "");
    const btw = normalizeBelgianVat(trimmed) ?? normalizeBelgianVat(`BE${vatDigits}`)!;
    const ondernemingsnummer = kboDirect ?? kboFromVat(btw) ?? vatDigits;

    return {
      ok: true,
      data: {
        name: json.name.trim(),
        btw,
        ondernemingsnummer,
        address: (json.address ?? "").trim(),
        street: parsed.street,
        postcode: parsed.postcode,
        city: parsed.city,
        country: "BE",
      },
    };
  } catch {
    return { error: "Opzoeken mislukt. Controleer je verbinding." };
  }
}
