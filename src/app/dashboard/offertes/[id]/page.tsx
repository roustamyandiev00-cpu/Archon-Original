import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Pencil } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { statusMeta, isOfferteEditable } from "@/lib/offertes";
import { projectIdFromOfferteType } from "@/components/dashboard/projecten/fromOfferte";
import GlowCard from "@/components/dashboard/GlowCard";
import OfferteStatusActions from "@/components/dashboard/offertes/OfferteStatusActions";
import DocumentDownload from "@/components/dashboard/documenten/DocumentDownload";
import {
  buildDocumentValues,
  buildDocumentRows,
  type CustomerLite,
} from "@/lib/documentData";
import {
  buildDocumentHtml,
  resolveDocumentTemplateId,
} from "@/components/dashboard/documenten/documentTemplate";
import { OfferteDocumentSheet } from "@/components/dashboard/offertes/OfferteDocumentPreview";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const offerteId = Number(id);
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId || Number.isNaN(offerteId)) {
    return { title: "Offerte — ArchonPro" };
  }

  const { data } = await supabase
    .from("offertes")
    .select("nummer, klant")
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!data?.nummer) return { title: "Offerte — ArchonPro" };

  const klant = data.klant?.trim();
  return {
    title: klant
      ? `${data.nummer} — ${klant} | ArchonPro`
      : `${data.nummer} | ArchonPro`,
  };
}

export default async function OfferteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offerteId = Number(id);
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId || Number.isNaN(offerteId)) notFound();

  const { data: offerte } = await supabase
    .from("offertes")
    .select(
      "id, nummer, klant, bedrag, datum, geldig_tot, status_new, notes, created_at, sent_at, accepted_at, rejected_at, customer_id, template_id, converted_to_invoice_id, converted_to_type",
    )
    .eq("id", offerteId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!offerte) notFound();

  const { data: lijnen } = await supabase
    .from("offerte_lijnen")
    .select("id, omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage")
    .eq("offerte_id", offerteId)
    .order("sort_order");

  const lines = (lijnen ?? []).map((l) => ({
    omschrijving: l.omschrijving ?? "",
    aantal: Number(l.aantal ?? 0),
    eenheid: l.eenheid ?? "stuks",
    prijs_per_eenheid: Number(l.prijs_per_eenheid ?? 0),
    btw_percentage: Number(l.btw_percentage ?? 0),
  }));
  const meta = statusMeta(offerte.status_new);
  const editable = isOfferteEditable(offerte.status_new);
  const gekoppeldProjectId = projectIdFromOfferteType(offerte.converted_to_type);

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select(
      "naam, adres, postcode, stad, telefoon, email, btw, iban, algemene_voorwaarden, footer_tekst, default_quote_template",
    )
    .eq("id", companyId)
    .maybeSingle();

  let customer: CustomerLite = null;
  if (offerte.customer_id) {
    const { data } = await supabase
      .from("customers")
      .select("name, company_name, first_name, last_name, address, email, phone, btw")
      .eq("id", offerte.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    customer = data;
  }

  const docValues = buildDocumentValues(
    {
      kind: "quote",
      nummer: offerte.nummer ?? `#${offerte.id}`,
      datum: offerte.datum,
      geldig_tot: offerte.geldig_tot,
      notes: offerte.notes,
      klant: offerte.klant,
    },
    bedrijf,
    customer,
    lines,
  );
  const docRows = buildDocumentRows(lines);
  const selectedTemplate = resolveDocumentTemplateId(
    offerte.template_id,
    bedrijf?.default_quote_template,
  );
  const documentHtml = buildDocumentHtml(
    selectedTemplate,
    "quote",
    docValues,
    docRows,
  );

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3">
      <Link
        href="/dashboard/offertes"
        className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <ArrowLeft
          size={15}
          className="transition-transform group-hover:-translate-x-0.5"
        />
        Terug naar offertes
      </Link>

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <OfferteDocumentSheet html={documentHtml} />

        <GlowCard
          subtle
          className="min-h-0 xl:h-full"
          innerClassName="h-full space-y-4 overflow-y-auto p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-lg font-semibold text-zinc-50">
                  {offerte.nummer ?? `#${offerte.id}`}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.tone}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{offerte.klant}</p>
            </div>
          </div>

          <div className="space-y-3">
            {editable && (
              <Link
                href={`/dashboard/offertes/${offerte.id}/bewerken`}
                className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/20"
              >
                <Pencil size={15} />
                Offerte bewerken
              </Link>
            )}
            <OfferteStatusActions
              id={offerte.id}
              status={offerte.status_new ?? "concept"}
            />

            <DocumentDownload
              kind="quote"
              documentId={offerte.id}
              currentTemplate={offerte.template_id ?? ""}
              defaultTemplate={bedrijf?.default_quote_template ?? ""}
              values={docValues}
              rows={docRows}
              variant="compact"
            />

            {(gekoppeldProjectId || offerte.converted_to_invoice_id) && (
              <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                {gekoppeldProjectId && (
                  <Link
                    href={`/dashboard/offertes/projecten/${gekoppeldProjectId}`}
                    className="text-sm text-violet-300 hover:text-violet-200"
                  >
                    Bekijk gekoppeld project
                  </Link>
                )}
                {offerte.converted_to_invoice_id && (
                  <Link
                    href={`/dashboard/facturen/${offerte.converted_to_invoice_id}`}
                    className="text-sm text-teal-300 hover:text-teal-200"
                  >
                    Bekijk gekoppelde factuur
                  </Link>
                )}
              </div>
            )}
          </div>
        </GlowCard>
      </div>
    </div>
  );
}
