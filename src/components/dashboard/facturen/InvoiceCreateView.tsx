"use client";

import Link from "next/link";
import {
  CalendarIcon,
  GripVertical,
  Hash,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import StudioInvoicePreview from "@/components/dashboard/facturen/studio/StudioInvoicePreview";
import {
  buildStudioInvoiceValues,
  formatStudioCurrency,
  formatStudioDisplayDate,
  getInitials,
  getStudioLineAmount,
  studioInvoiceClients,
  studioInvoiceTaxOptions,
  type StudioInvoiceDiscountType,
} from "@/components/dashboard/facturen/studio/studio-invoice-data";
import type { FactuurDocumentContext } from "@/components/dashboard/facturen/FactuurForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import type { BedrijfLite } from "@/lib/documentData";
import type { OfferteLijnInput } from "@/lib/offertes";

type Customer = {
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

type TabId = "invoice" | "payment" | "business";

type Props = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  reference: string;
  onReferenceChange: (value: string) => void;
  datum: string;
  onDatumChange: (value: string) => void;
  vervaldatum: string;
  onVervaldatumChange: (value: string) => void;
  customers: Customer[];
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  klantVrij: string;
  onKlantVrijChange: (value: string) => void;
  klantNaam: string;
  klantEmail: string;
  lines: OfferteLijnInput[];
  onUpdateLine: (index: number, patch: Partial<OfferteLijnInput>) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  taxId: string;
  onTaxIdChange: (taxId: string) => void;
  discountType: StudioInvoiceDiscountType;
  onDiscountTypeChange: (type: StudioInvoiceDiscountType) => void;
  discountValue: number;
  onDiscountValueChange: (value: number) => void;
  bedrijf: BedrijfLite;
  documentContext: FactuurDocumentContext;
  loading: boolean;
  error: string | null;
  useStudioDemoFrom?: boolean;
  onSaveDraft: () => void;
  onSend: () => void;
};

function Separator() {
  return <hr className="border-zinc-200" />;
}

function StudioTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "invoice", label: "Invoice" },
    { id: "payment", label: "Payment" },
    { id: "business", label: "Business" },
  ];

  return (
    <div className="grid h-9 w-full grid-cols-3 rounded-lg bg-zinc-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`inline-flex items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function DatePickerField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-zinc-500">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            className="flex h-9 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 text-left text-sm font-normal text-zinc-900 hover:bg-zinc-50"
          >
            <span>{formatStudioDisplayDate(value)}</span>
            <CalendarIcon size={16} className="text-zinc-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <Input
            type="date"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-9"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function InvoiceCreateView(props: Props) {
  const {
    activeTab,
    onTabChange,
    reference,
    onReferenceChange,
    datum,
    onDatumChange,
    vervaldatum,
    onVervaldatumChange,
    customerId,
    onCustomerIdChange,
    klantVrij,
    onKlantVrijChange,
    klantNaam,
    klantEmail,
    lines,
    onUpdateLine,
    onAddLine,
    onRemoveLine,
    taxId,
    onTaxIdChange,
    discountType,
    onDiscountTypeChange,
    discountValue,
    onDiscountValueChange,
    bedrijf,
    loading,
    error,
    useStudioDemoFrom,
    onSaveDraft,
    onSend,
  } = props;

  const studioInvoice = buildStudioInvoiceValues({
    reference,
    datum,
    vervaldatum,
    bedrijf,
    klantNaam,
    klantEmail,
    taxId,
    discountType,
    discountValue,
    lines,
    useStudioDemoFrom,
  });

  const selectedClientId =
    studioInvoiceClients.find((client) => client.name === klantNaam)?.id ??
    "custom";

  const invoiceTab = (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="reference-number" className="text-xs text-zinc-500">
            Reference Number
          </label>
          <div className="relative">
            <Input
              id="reference-number"
              value={reference}
              onChange={(event) => onReferenceChange(event.target.value)}
              className="h-9 pr-9 font-mono text-sm"
            />
            <Hash
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <DatePickerField
            id="issued-date"
            label="Issued Date"
            value={datum}
            onChange={onDatumChange}
          />
          <DatePickerField
            id="payment-due-date"
            label="Due Date"
            value={vervaldatum}
            onChange={onVervaldatumChange}
          />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium tracking-tight text-zinc-900">Billed To</h2>
          <Link
            href="/dashboard/contacten"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <Plus size={16} />
            Add New Client
          </Link>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="client-select" className="text-xs text-zinc-500">
            Client
          </label>
          <Select
            id="client-select"
            value={selectedClientId}
            onChange={(event) => {
              const nextClient = studioInvoiceClients.find(
                (client) => client.id === event.target.value,
              );
              if (nextClient) {
                onCustomerIdChange("");
                onKlantVrijChange(nextClient.name);
              }
            }}
            className="h-9"
          >
            {studioInvoiceClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
            {selectedClientId === "custom" ? (
              <option value="custom">{klantNaam}</option>
            ) : null}
          </Select>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
            {getInitials(klantNaam).slice(0, 2) || "AC"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900">{klantNaam}</p>
            <p className="truncate text-xs text-zinc-500">{klantEmail}</p>
          </div>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium tracking-tight text-zinc-900">Invoice Items</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 border-transparent px-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            onClick={onAddLine}
          >
            <Plus size={16} />
            Add Item
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="hidden items-center gap-2 px-1 text-xs font-medium text-zinc-500 md:grid md:grid-cols-[24px_minmax(0,1fr)_64px_112px_112px_32px]">
            <span />
            <span>Description</span>
            <span className="px-2">Units</span>
            <span className="px-2">Unit cost</span>
            <span className="text-right">Line Total</span>
            <span />
          </div>

          <div className="flex flex-col gap-3">
            {lines.map((line, index) => {
              const item = {
                id: `line-${index}`,
                description: line.omschrijving,
                quantity: Number(line.aantal) || 0,
                unitPrice: Number(line.prijs_per_eenheid) || 0,
              };

              return (
                <div
                  key={index}
                  className="grid min-w-0 grid-cols-[24px_minmax(0,0.8fr)_minmax(0,1fr)_32px] items-center gap-2 md:grid-cols-[24px_minmax(0,1fr)_64px_112px_112px_32px]"
                >
                  <button
                    type="button"
                    aria-label={`Reorder line ${index + 1}`}
                    className="grid h-8 w-6 place-items-center text-zinc-400"
                  >
                    <GripVertical size={16} />
                  </button>
                  <Input
                    value={line.omschrijving}
                    onChange={(event) =>
                      onUpdateLine(index, { omschrijving: event.target.value })
                    }
                    aria-label={`Item ${index + 1} description`}
                    className="h-9 min-w-0 text-sm max-md:col-span-3"
                  />
                  <Input
                    type="number"
                    step="1"
                    min={0}
                    value={line.aantal}
                    onChange={(event) =>
                      onUpdateLine(index, { aantal: Number(event.target.value) })
                    }
                    aria-label={`Item ${index + 1} quantity`}
                    className="h-9 text-sm max-md:col-start-2 max-md:row-start-2"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={line.prijs_per_eenheid}
                    onChange={(event) =>
                      onUpdateLine(index, {
                        prijs_per_eenheid: Number(event.target.value),
                      })
                    }
                    aria-label={`Item ${index + 1} unit price`}
                    className="h-9 text-sm max-md:col-start-3 max-md:row-start-2"
                  />
                  <div className="min-w-0 text-right text-sm font-medium text-zinc-900 max-md:col-span-3 max-md:col-start-2 max-md:row-start-3 max-md:flex max-md:items-center max-md:justify-between max-md:text-left">
                    <span className="hidden text-zinc-500 max-md:inline">Line total</span>
                    <span>{formatStudioCurrency(getStudioLineAmount(item))}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 max-md:col-start-4 max-md:row-start-2"
                    aria-label={`Remove item ${index + 1}`}
                    onClick={() => onRemoveLine(index)}
                    disabled={lines.length === 1}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="font-medium tracking-tight text-zinc-900">Adjustments</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="tax-select" className="text-xs text-zinc-500">
              Tax
            </label>
            <Select
              id="tax-select"
              value={taxId}
              onChange={(event) => onTaxIdChange(event.target.value)}
              className="h-9"
            >
              {studioInvoiceTaxOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} ({option.rate}%)
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="discount-type" className="text-xs text-zinc-500">
                Discount
              </label>
              <Select
                id="discount-type"
                value={discountType}
                onChange={(event) =>
                  onDiscountTypeChange(event.target.value as StudioInvoiceDiscountType)
                }
                className="h-9"
              >
                <option value="fixed">Fixed amount</option>
                <option value="percent">Percent</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="discount-value" className="text-xs text-zinc-500">
                Value
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                  {discountType === "fixed" ? "$" : "%"}
                </span>
                <Input
                  id="discount-value"
                  type="number"
                  min={0}
                  step="any"
                  value={discountValue}
                  onChange={(event) =>
                    onDiscountValueChange(Number(event.target.value))
                  }
                  className="h-9 pl-7 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const paymentTab = (
    <section className="grid gap-3 sm:grid-cols-2">
      {[
        { label: "Payment account", value: studioInvoice.from.paymentAccountName },
        { label: "Routing no.", value: studioInvoice.from.routingNumber },
        { label: "Reference", value: reference },
        { label: "Payment due", value: vervaldatum },
      ].map((field) => (
        <div
          key={field.label}
          className="rounded-lg border border-zinc-200 px-3.5 py-2.5"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {field.label}
          </p>
          <p className="mt-0.5 truncate font-mono text-sm text-zinc-800">
            {field.value || "—"}
          </p>
        </div>
      ))}
    </section>
  );

  const businessTab = (
    <section className="grid gap-3 sm:grid-cols-2">
      {[
        { label: "Business name", value: studioInvoice.from.name },
        { label: "Tax ID", value: studioInvoice.from.taxId },
        { label: "Email", value: studioInvoice.from.email },
        { label: "Phone", value: studioInvoice.from.phone },
        { label: "Website", value: studioInvoice.from.website },
        { label: "Issuer", value: studioInvoice.from.issuerName },
      ].map((field) => (
        <div
          key={field.label}
          className="rounded-lg border border-zinc-200 px-3.5 py-2.5"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {field.label}
          </p>
          <p className="mt-0.5 truncate text-sm text-zinc-800">{field.value || "—"}</p>
        </div>
      ))}
    </section>
  );

  return (
    <div className="studio-invoice-create flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-medium leading-none tracking-tight text-zinc-900">
            Create New Invoice
          </h1>
          <p className="text-sm text-zinc-500">
            Add invoice details, review the preview, and send it to your client.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading}
            className="h-9 border border-zinc-200 bg-white px-3 text-zinc-900 hover:bg-zinc-50"
            onClick={onSaveDraft}
          >
            <Save size={16} />
            Save as Draft
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={loading}
            className="h-9 border-zinc-900 bg-zinc-900 px-3 text-white hover:bg-zinc-800"
            onClick={onSend}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Send Invoice
          </Button>
        </div>
      </div>

      {error ? (
        <p className="shrink-0 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-5 overflow-hidden xl:grid-cols-2">
        <div className="studio-invoice-form flex min-h-0 flex-col gap-4 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4">
          <StudioTabs activeTab={activeTab} onTabChange={onTabChange} />
          <div className="min-h-0 flex-1 overflow-hidden">
            {activeTab === "invoice" && (
              <div className="flex h-full flex-col gap-4 overflow-hidden">{invoiceTab}</div>
            )}
            {activeTab === "payment" && paymentTab}
            {activeTab === "business" && businessTab}
          </div>
        </div>

        <StudioInvoicePreview invoice={studioInvoice} />
      </div>
    </div>
  );
}

export function getDemoInvoiceLines(): OfferteLijnInput[] {
  return [
    {
      omschrijving: "Cloud hosting services",
      aantal: 1,
      eenheid: "stuks",
      prijs_per_eenheid: 3500,
      btw_percentage: 12,
    },
    {
      omschrijving: "Data analytics report",
      aantal: 2,
      eenheid: "stuks",
      prijs_per_eenheid: 750,
      btw_percentage: 12,
    },
    {
      omschrijving: "Technical support retainer",
      aantal: 1,
      eenheid: "stuks",
      prijs_per_eenheid: 400,
      btw_percentage: 12,
    },
  ];
}
