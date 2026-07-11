import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { formatEuro, formatDate, lineTotals } from "@/lib/offertes";
import { factuurStatusMeta, documentTypeMeta } from "@/lib/facturen";
import GlowCard from "@/components/dashboard/GlowCard";
import DocumentDownload from "@/components/dashboard/documenten/DocumentDownload";
import PeppolActions from "@/components/dashboard/documenten/PeppolActions";
import MarkFactuurPaidButton from "@/components/dashboard/facturen/MarkFactuurPaidButton";
import {
  buildDocumentValues,
  buildDocumentRows,
  type CustomerLite,
} from "@/lib/documentData";
import { untyped } from "@/lib/integraties";
import { getPeppolConfig } from "@/lib/peppol/build";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const factuurId = Number(id);
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId || Number.isNaN(factuurId)) {
    return { title: "Factuur — ArchonPro" };
  }

  const { data } = await supabase
    .from("facturen")
    .select("nummer, klant")
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!data?.nummer) return { title: "Factuur — ArchonPro" };

  const klant = data.klant?.trim();
  return {
    title: klant
      ? `${data.nummer} — ${klant} | ArchonPro`
      : `${data.nummer} | ArchonPro`,
  };
}

export default async function FactuurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const factuurId = Number(id);
  const { supabase, companyId } = await getCompanyContext();

  if (!companyId || Number.isNaN(factuurId)) notFound();

  const { data: factuur } = await supabase
    .from("facturen")
    .select(
      "id, nummer, klant, totaal_bedrag, datum, vervaldatum, status, document_type, omschrijving, notities, created_at, paid_at, customer_id, template_id, offerte_id, buyer_reference, structured_communication, peppol_status, peppol_last_error",
    )
    .eq("id", factuurId)
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  if (!factuur) notFound();

  const { data: lijnen } = await supabase
    .from("factuur_lijnen")
    .select("id, omschrijving, aantal, eenheid, prijs_per_eenheid, btw_percentage")
    .eq("factuur_id", factuurId)
    .order("sort_order");

  const lines = (lijnen ?? []).map((l) => ({
    omschrijving: l.omschrijving ?? "",
    aantal: Number(l.aantal ?? 0),
    eenheid: l.eenheid ?? "stuks",
    prijs_per_eenheid: Number(l.prijs_per_eenheid ?? 0),
    btw_percentage: Number(l.btw_percentage ?? 0),
  }));
  const totals = lineTotals(lines);
  const meta = factuurStatusMeta(factuur.status);
  const typeMeta = documentTypeMeta(factuur.document_type);
  const isProforma = factuur.document_type === "proforma";
  const isPaid = Boolean(factuur.paid_at) || factuur.status === "betaald";

  const { data: bedrijf } = await supabase
    .from("bedrijven")
    .select(
      "naam, adres, postcode, stad, telefoon, email, btw, iban, algemene_voorwaarden, footer_tekst, default_invoice_template",
    )
    .eq("id", companyId)
    .maybeSingle();

  let customer: CustomerLite = null;
  if (factuur.customer_id) {
    const { data } = await supabase
      .from("customers")
      .select("name, company_name, first_name, last_name, address, email, phone, btw")
      .eq("id", factuur.customer_id)
      .eq("company_id", companyId)
      .maybeSingle();
    customer = data;
  }

  const docValues = buildDocumentValues(
    {
      kind: "invoice",
      nummer: factuur.nummer ?? `#${factuur.id}`,
      datum: factuur.datum,
      vervaldatum: factuur.vervaldatum,
      omschrijving: factuur.omschrijving,
      klant: factuur.klant,
      isProforma,
    },
    bedrijf,
    customer,
    lines,
  );
  const docRows = buildDocumentRows(lines);

  const peppol = await getPeppolConfig(supabase, companyId);
  const peppolConnected = Boolean(peppol);
  const peppolCanSend =
    peppolConnected &&
    (peppol?.accessPoint === "storecove" || peppol?.accessPoint === "billit") &&
    Boolean(peppol?.apiKey);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard/facturen/lijst"
        className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <ArrowLeft
          size={15}
          className="transition-transform group-hover:-translate-x-0.5"
        />
        Terug naar facturen
      </Link>

      <GlowCard innerClassName="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold text-zinc-50">
                {factuur.nummer ?? `#${factuur.id}`}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${typeMeta.tone}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${typeMeta.dot}`} />
                {typeMeta.label}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.tone}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
            <p className="mt-1.5 text-lg text-zinc-200">{factuur.klant}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              {isProforma ? "Totaal" : "Te betalen"}
            </p>
            <p className="font-mono text-2xl font-semibold text-zinc-50">
              {formatEuro(factuur.totaal_bedrag)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 py-6 sm:grid-cols-3">
          <Meta label="Datum" value={formatDate(factuur.datum)} />
          <Meta
            label="Vervaldatum"
            value={isProforma ? "—" : formatDate(factuur.vervaldatum)}
          />
          <Meta label="Aangemaakt" value={formatDate(factuur.created_at)} />
        </div>

        {factuur.omschrijving && (
          <p className="mb-4 text-sm text-zinc-300">{factuur.omschrijving}</p>
        )}

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
              <span>{isProforma ? "Totaal" : "Te betalen"}</span>
              <span className="font-mono">{formatEuro(totals.totaal)}</span>
            </div>
          </div>
        </div>

        {isProforma && (
          <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Dit is een proforma en geldt niet als officiële factuur.
          </div>
        )}

        {factuur.notities && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-500">
              Notities
            </p>
            <p className="whitespace-pre-line text-sm text-zinc-300">
              {factuur.notities}
            </p>
          </div>
        )}

        {factuur.offerte_id && (
          <Link
            href={`/dashboard/offertes/${factuur.offerte_id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/20"
          >
            Bekijk bronofferte
          </Link>
        )}

        <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
          {!isProforma && !isPaid && (
            <MarkFactuurPaidButton
              factuurId={factuur.id}
              nummer={factuur.nummer ?? `#${factuur.id}`}
            />
          )}
          <DocumentDownload
            kind="invoice"
            documentId={factuur.id}
            currentTemplate={factuur.template_id ?? ""}
            defaultTemplate={bedrijf?.default_invoice_template ?? ""}
            values={docValues}
            rows={docRows}
          />
          <PeppolActions
            factuurId={factuur.id}
            peppolConnected={peppolConnected}
            peppolCanSend={peppolCanSend}
            buyerReference={factuur.buyer_reference}
            structuredCommunication={factuur.structured_communication}
            peppolStatus={factuur.peppol_status}
            peppolLastError={factuur.peppol_last_error}
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
