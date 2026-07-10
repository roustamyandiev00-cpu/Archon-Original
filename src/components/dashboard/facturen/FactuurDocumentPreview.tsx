"use client";

import { useMemo } from "react";
import {
  buildDocumentHtml,
  resolveDocumentTemplateId,
} from "@/components/dashboard/documenten/documentTemplate";
import { archonTemplateMeta } from "@/components/dashboard/instellingen/templatePreview";
import {
  buildDocumentRows,
  buildDocumentValues,
  type BedrijfLite,
  type CustomerLite,
} from "@/lib/documentData";
import type { OfferteLijnInput } from "@/lib/offertes";
import type { FactuurDocumentType } from "@/lib/facturen";

type PreviewCustomer = {
  id: number;
  name: string;
  company_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  btw?: string | null;
};

export default function FactuurDocumentPreview({
  templateId,
  defaultTemplate,
  bedrijf,
  customers,
  customerId,
  klantVrij,
  documentType,
  datum,
  vervaldatum,
  omschrijving,
  notities,
  lines,
  nummer,
}: {
  templateId?: string;
  defaultTemplate: string;
  bedrijf: BedrijfLite;
  customers: PreviewCustomer[];
  customerId: string;
  klantVrij: string;
  documentType: FactuurDocumentType;
  datum: string;
  vervaldatum: string | null;
  omschrijving: string;
  notities: string;
  lines: OfferteLijnInput[];
  nummer?: string;
}) {
  const renderId = resolveDocumentTemplateId(templateId, defaultTemplate);
  const templateLabel = archonTemplateMeta(renderId)?.label ?? "Sjabloon";
  const isProforma = documentType === "proforma";

  const html = useMemo(() => {
    const selected = customers.find((c) => String(c.id) === customerId);
    const klant =
      selected?.name?.trim() || klantVrij.trim() || "Klant";

    const customer: CustomerLite = selected
      ? {
          name: selected.name,
          company_name: selected.company_name,
          first_name: selected.first_name ?? null,
          last_name: selected.last_name ?? null,
          address: selected.address ?? null,
          email: selected.email ?? null,
          phone: selected.phone ?? null,
          btw: selected.btw ?? null,
        }
      : null;

    const docLines = lines.map((l) => ({
      omschrijving: l.omschrijving,
      aantal: Number(l.aantal) || 0,
      eenheid: l.eenheid,
      prijs_per_eenheid: Number(l.prijs_per_eenheid) || 0,
      btw_percentage: Number(l.btw_percentage) || 0,
    }));

    const values = buildDocumentValues(
      {
        kind: "invoice",
        nummer: nummer ?? "Concept",
        datum,
        vervaldatum,
        omschrijving: [omschrijving, notities].filter(Boolean).join("\n\n") || null,
        klant,
        isProforma,
      },
      bedrijf,
      customer,
      docLines,
    );
    const rows = buildDocumentRows(docLines);

    return buildDocumentHtml(renderId, "invoice", values, rows);
  }, [
    bedrijf,
    customerId,
    customers,
    datum,
    isProforma,
    klantVrij,
    lines,
    notities,
    nummer,
    omschrijving,
    renderId,
    vervaldatum,
  ]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[820px] flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
        <iframe
          title="Factuurvoorbeeld"
          srcDoc={html}
          className="h-[min(78vh,880px)] w-full border-0 bg-white"
        />
      </div>
      <p className="mt-3 text-center text-[11px] text-zinc-600">
        Sjabloon: {templateLabel}
      </p>
    </div>
  );
}
