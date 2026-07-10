import {
  normalizeBelgianVat,
  normalizeKbo,
  peppolEndpointFromParty,
} from "@/lib/peppol/be";
import type { UblInvoice } from "@/lib/peppol/ubl";

export type MercuriusIssue = {
  field: string;
  message: string;
  severity: "error" | "warning";
};

export type MercuriusReadiness = {
  ok: boolean;
  issues: MercuriusIssue[];
};

/** Valideert of een factuur voldoet aan Belgische B2G / Mercurius-vereisten. */
export function validateMercuriusInvoice(input: {
  ubl: UblInvoice;
  customerIsOverheid: boolean;
  mercuriusEntiteitId?: string | null;
}): MercuriusReadiness {
  const issues: MercuriusIssue[] = [];

  if (!input.customerIsOverheid) {
    issues.push({
      field: "customer",
      message:
        "Markeer de klant als overheidsklant (Mercurius) in Contacten.",
      severity: "error",
    });
  }

  const buyerRef = input.ubl.buyerReference?.trim();
  if (!buyerRef) {
    issues.push({
      field: "buyer_reference",
      message:
        "Kopersreferentie (BT-10) is verplicht voor overheid — vul bestelbon- of contractref in.",
      severity: "error",
    });
  }

  const customer = input.ubl.customer;
  const customerPeppolId =
    customer.endpointScheme && customer.endpointValue
      ? `${customer.endpointScheme}:${customer.endpointValue}`
      : null;

  const endpoint = peppolEndpointFromParty({
    peppolParticipantId: input.mercuriusEntiteitId ?? customerPeppolId,
    kbo: customer.endpointScheme === "0208" ? customer.endpointValue : null,
    vat: customer.vat,
  });

  if (!endpoint) {
    issues.push({
      field: "peppol_id",
      message:
        "Overheidsklant heeft geen Peppol-ID of KBO. Mercurius routeert via Peppol.",
      severity: "error",
    });
  } else if (endpoint.scheme !== "0208" && endpoint.scheme !== "9925") {
    issues.push({
      field: "peppol_id",
      message: `Peppol-endpoint ${endpoint.scheme}:${endpoint.value} — controleer of dit een geldige overheidsentiteit is.`,
      severity: "warning",
    });
  }

  if (!input.ubl.structuredCommunication?.trim()) {
    issues.push({
      field: "structured_communication",
      message:
        "Gestructureerde mededeling ontbreekt — aanbevolen voor betalingscontrole door overheid.",
      severity: "warning",
    });
  }

  const customerKbo =
    customer.endpointScheme === "0208" ? customer.endpointValue : null;
  if (!normalizeKbo(customerKbo) && !normalizeBelgianVat(customer.vat)) {
    issues.push({
      field: "vat_kbo",
      message: "KBO of BTW-nummer van de overheidsklant ontbreekt.",
      severity: "error",
    });
  }

  const hasError = issues.some((i) => i.severity === "error");
  return { ok: !hasError, issues };
}

/** Bekende Belgische overheids-Peppol hints (indicatief, niet exhaustief). */
export const MERCURIUS_HINTS = [
  "Mercurius is het centrale B2G-platform van de Belgische overheid.",
  "Facturen worden doorgaans via Peppol naar de overheidsentiteit gestuurd.",
  "Vul altijd een bestelbon- of contractreferentie in (BT-10).",
  "Controleer het KBO-nummer en Peppol-ID van de entiteit op Mercurius.",
];
