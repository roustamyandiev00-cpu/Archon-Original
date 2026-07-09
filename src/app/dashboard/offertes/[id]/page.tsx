import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import {
  statusMeta,
  formatEuro,
  formatDate,
  lineTotals,
  isOfferteEditable,
} from "@/lib/offertes";
import GlowCard from "@/components/dashboard/GlowCard";
import OfferteStatusActions from "@/components/dashboard/offertes/OfferteStatusActions";
import DocumentDownload from "@/components/dashboard/documenten/DocumentDownload";
import {
  buildDocumentValues,
  buildDocumentRows,
  type CustomerLite,
} from "@/lib/documentData";

export const metadata = { title: "Offerte — ArchonPro" };

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
      "id, nummer, klant, bedrag, datum, geldig_tot, status_new, notes, created_at, sent_at, accepted_at, rejected_at, customer_id, template_id",
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
  const totals = lineTotals(lines);
  const meta = statusMeta(offerte.status_new);
  const editable = isOfferteEditable(offerte.status_new);

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select(
      "naam, adres, postcode, stad, telefoon, email, btw, iban, algemene_voorwaarden, footer_tekst",
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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

      <GlowCard innerClassName="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold text-zinc-50">
                {offerte.nummer ?? `#${offerte.id}`}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.tone}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
            <p className="mt-1.5 text-lg text-zinc-200">{offerte.klant}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              Totaal
            </p>
            <p className="font-mono text-2xl font-semibold text-zinc-50">
              {formatEuro(offerte.bedrag)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 py-6 sm:grid-cols-3">
          <Meta label="Datum" value={formatDate(offerte.datum)} />
          <Meta label="Geldig tot" value={formatDate(offerte.geldig_tot)} />
          <Meta
            label="Aangemaakt"
            value={formatDate(offerte.created_at)}
          />
        </div>

        {/* Lijnen */}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-2.5 font-semibold">Omschrijving</th>
                <th className="px-4 py-2.5 text-right font-semibold">Aantal</th>
                <th className="px-4 py-2.5 text-right font-semibold">Prijs</th>
                <th className="px-4 py-2.5 text-right font-semibold">BTW</th>
                <th className="px-4 py-2.5 text-right font-semibold">Totaal</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-2.5 text-zinc-200">
                    {l.omschrijving || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-400">
                    {l.aantal} {l.eenheid}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-400">
                    {formatEuro(l.prijs_per_eenheid)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-400">
                    {l.btw_percentage}%
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-100">
                    {formatEuro(l.aantal * l.prijs_per_eenheid)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotaal</span>
              <span className="font-mono">{formatEuro(totals.subtotaal)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>BTW</span>
              <span className="font-mono">{formatEuro(totals.btw)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-1.5 text-base font-semibold text-zinc-100">
              <span>Totaal</span>
              <span className="font-mono">{formatEuro(totals.totaal)}</span>
            </div>
          </div>
        </div>

        {offerte.notes && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-500">
              Notities
            </p>
            <p className="whitespace-pre-line text-sm text-zinc-300">
              {offerte.notes}
            </p>
          </div>
        )}

        <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
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
            values={docValues}
            rows={docRows}
          />
        </div>
      </GlowCard>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-zinc-200">{value}</p>
    </div>
  );
}
