import {
  formatStudioCurrency,
  formatStudioDisplayDate,
  getStudioInvoiceDiscount,
  getStudioInvoiceSubtotal,
  getStudioInvoiceTax,
  getStudioInvoiceTaxOption,
  getStudioInvoiceTotal,
  getStudioLineAmount,
  STUDIO_INVOICE_PAPER_HEIGHT,
  STUDIO_INVOICE_PAPER_WIDTH,
  type StudioInvoiceFormValues,
} from "@/components/dashboard/facturen/studio/studio-invoice-data";

export default function StudioInvoicePaper({
  invoice,
}: {
  invoice: StudioInvoiceFormValues;
}) {
  const taxOption = getStudioInvoiceTaxOption(invoice);
  const discountValue = Number.isFinite(invoice.discountValue)
    ? invoice.discountValue
    : 0;
  const discountLabel =
    invoice.discountType === "percent"
      ? `Korting ${discountValue}%`
      : "Korting";

  return (
    <article
      style={{
        width: STUDIO_INVOICE_PAPER_WIDTH,
        height: STUDIO_INVOICE_PAPER_HEIGHT,
      }}
      data-print-paper
      className="relative flex flex-col gap-24 bg-neutral-50 px-12.25 py-11 font-mono text-neutral-950"
    >
      <header className="flex flex-col gap-10">
        <div className="grid grid-cols-2 items-start gap-14">
          <svg className="size-12" viewBox="0 0 48 48" aria-hidden="true">
            <rect width="20" height="20" rx="3" fill="currentColor" />
            <rect x="28" width="20" height="20" rx="3" fill="currentColor" />
            <rect y="28" width="20" height="20" rx="3" fill="currentColor" />
            <rect x="28" y="28" width="20" height="20" rx="3" fill="currentColor" />
          </svg>
          <h2 className="text-4xl uppercase tracking-widest">Factuur</h2>
        </div>

        <section className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <div>
            <p>Referentie: {invoice.referenceNumber}</p>
            <p>Datum: {formatStudioDisplayDate(invoice.issuedDate)}</p>
            <p>Vervalt: {formatStudioDisplayDate(invoice.paymentDueDate)}</p>
          </div>
          <div>
            <p>Betalingsrekening</p>
            <p>{invoice.from.paymentAccountName}</p>
            <p>IBAN {invoice.from.routingNumber}</p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <div>
            <p className="mb-4 font-semibold uppercase">Van</p>
            <p>{invoice.from.name}</p>
            {invoice.from.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>BTW: {invoice.from.taxId}</p>
          </div>
          <div>
            <p className="mb-4 font-semibold uppercase">Aan</p>
            <p>{invoice.to.name}</p>
            {invoice.to.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>BTW: {invoice.to.taxId}</p>
          </div>
        </section>
      </header>

      <div className="flex flex-col gap-5">
        <section className="text-sm">
          <div className="grid grid-cols-[1fr_74px_116px_116px] bg-stone-200 px-3 py-3 font-semibold uppercase">
            <span>Omschrijving</span>
            <span className="text-right">Aantal</span>
            <span className="text-right">Prijs</span>
            <span className="text-right">Totaal</span>
          </div>
          {invoice.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_74px_116px_116px] border-b border-[oklch(0.86_0_0)] px-3 py-4"
            >
              <span>{item.description}</span>
              <span className="text-right">{item.quantity}</span>
              <span className="text-right">
                {formatStudioCurrency(item.unitPrice)}
              </span>
              <span className="text-right">
                {formatStudioCurrency(getStudioLineAmount(item))}
              </span>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <section className="col-start-2 space-y-2">
            <div>
              <div className="flex justify-between gap-8">
                <span>Subtotaal</span>
                <span>
                  {formatStudioCurrency(getStudioInvoiceSubtotal(invoice))}
                </span>
              </div>
              <div className="flex justify-between gap-8">
                <span>{discountLabel}</span>
                <span>
                  {formatStudioCurrency(getStudioInvoiceDiscount(invoice))}
                </span>
              </div>
              <div className="flex justify-between gap-8">
                <span>
                  {taxOption.name} {taxOption.rate}%
                </span>
                <span>{formatStudioCurrency(getStudioInvoiceTax(invoice))}</span>
              </div>
            </div>
            <div className="border-y-2 border-current py-3">
              <div className="flex justify-between gap-8">
                <span className="font-semibold uppercase">Te betalen</span>
                <span className="font-semibold">
                  {formatStudioCurrency(getStudioInvoiceTotal(invoice))}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="absolute bottom-11 left-12.25 right-12.25 grid grid-cols-2 gap-14 text-sm leading-relaxed text-neutral-500">
        <div>
          <p>{invoice.from.email}</p>
          <p>{invoice.from.phone}</p>
          <p>{invoice.from.website}</p>
        </div>
        <div>
          <p>Gelieve tijdig te betalen.</p>
          <p>
            {invoice.from.issuerName
              ? `Opgemaakt door ${invoice.from.issuerName}`
              : ""}
          </p>
        </div>
      </footer>
    </article>
  );
}
