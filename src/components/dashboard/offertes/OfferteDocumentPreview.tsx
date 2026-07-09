"use client";

import { useMemo } from "react";
import { Eye } from "lucide-react";
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

export default function OfferteDocumentPreview({
  templateId,
  defaultTemplate,
  bedrijf,
  customers,
  customerId,
  klantVrij,
  datum,
  geldigTot,
  notes,
  lines,
  nummer,
  embedded = false,
}: {
  templateId?: string;
  defaultTemplate: string;
  bedrijf: BedrijfLite;
  customers: PreviewCustomer[];
  customerId: string;
  klantVrij: string;
  datum: string;
  geldigTot: string;
  notes: string;
  lines: OfferteLijnInput[];
  nummer?: string;
  embedded?: boolean;
}) {
  const renderId = resolveDocumentTemplateId(templateId, defaultTemplate);
  const templateLabel = archonTemplateMeta(renderId)?.label ?? "Sjabloon";

  const html = useMemo(() => {
    const selected = customers.find((c) => String(c.id) === customerId);
    const klant =
      selected?.name?.trim() ||
      klantVrij.trim() ||
      "Klant";

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
        kind: "quote",
        nummer: nummer ?? "Concept",
        datum,
        geldig_tot: geldigTot,
        notes,
        klant,
      },
      bedrijf,
      customer,
      docLines,
    );
    const rows = buildDocumentRows(docLines);

    return buildDocumentHtml(renderId, "quote", values, rows);
  }, [
    bedrijf,
    customerId,
    customers,
    datum,
    defaultTemplate,
    geldigTot,
    klantVrij,
    lines,
    notes,
    nummer,
    renderId,
    templateId,
  ]);

  const frame = (
    <div
      className={`mx-auto flex w-full max-w-[720px] flex-1 flex-col overflow-hidden bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] ${
        embedded ? "rounded-lg" : "rounded-2xl border border-white/10"
      }`}
    >
      <iframe
        title="Offertevoorbeeld"
        srcDoc={html}
        className={`w-full border-0 bg-white ${
          embedded ? "h-[min(72vh,820px)]" : "h-[min(80vh,920px)]"
        }`}
      />
    </div>
  );

  if (embedded) {
    return (
      <div className="flex min-w-0 flex-1 flex-col">
        {frame}
        <p className="mt-3 text-center text-[11px] text-zinc-600">
          Sjabloon: {templateLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="lg:sticky lg:top-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <Eye size={15} className="text-sky-400" />
          Sjabloonvoorbeeld
        </h2>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400">
          {templateLabel}
        </span>
      </div>
      <p className="mb-3 text-xs text-zinc-500">
        Dit is je gekozen sjabloon uit Instellingen. De preview werkt live mee
        terwijl je invult.
      </p>
      {frame}
    </div>
  );
}
