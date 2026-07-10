"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Loader2,
  FileText,
  FileClock,
  Save,
  Send,
  Building2,
  CreditCard,
  ReceiptText,
  UserPlus,
  Printer,
  Download,
} from "lucide-react";
import { createFactuur } from "@/app/dashboard/facturen/actions";
import FactuurDocumentPreview from "@/components/dashboard/facturen/FactuurDocumentPreview";
import InvoiceCreateView, {
  getDemoInvoiceLines,
} from "@/components/dashboard/facturen/InvoiceCreateView";
import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Button } from "@/components/dashboard/admin/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/dashboard/admin/ui/card";
import { Input } from "@/components/dashboard/admin/ui/input";
import { Select } from "@/components/dashboard/admin/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/dashboard/admin/ui/table";
import {
  lineTotals,
  formatEuro,
  type OfferteLijnInput,
} from "@/lib/offertes";
import { documentTypeMeta, type FactuurDocumentType } from "@/lib/facturen";
import type { BedrijfLite } from "@/lib/documentData";

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

export type FactuurDocumentContext = {
  defaultTemplate: string;
  templateId?: string;
  bedrijf: BedrijfLite;
};

const emptyLine: OfferteLijnInput = {
  omschrijving: "",
  aantal: 1,
  eenheid: "stuks",
  prijs_per_eenheid: 0,
  btw_percentage: 21,
};

function today() {
  return new Date().toISOString().slice(0, 10);
}
function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function hasValidLines(lines: OfferteLijnInput[]) {
  return lines.some(
    (l) => l.omschrijving.trim() !== "" || Number(l.prijs_per_eenheid) > 0,
  );
}

function customerInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function previewReference(documentType: FactuurDocumentType) {
  const prefix = documentTypeMeta(documentType).prefix;
  const year = new Date().getFullYear();
  return `${prefix}-${year}-XXXX`;
}

export default function FactuurForm({
  customers,
  documentContext,
  embedded = false,
  viewportFit = false,
  isDemo = false,
}: {
  customers: Customer[];
  documentContext: FactuurDocumentContext;
  embedded?: boolean;
  viewportFit?: boolean;
  isDemo?: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "factuur" | "betaling" | "bedrijf"
  >("factuur");

  const [documentType, setDocumentType] =
    useState<FactuurDocumentType>("factuur");
  const [customerId, setCustomerId] = useState<string>("");
  const [klantVrij, setKlantVrij] = useState(() =>
    viewportFit && isDemo ? "Yannova BV" : "",
  );
  const [datum, setDatum] = useState(today());
  const [vervaldatum, setVervaldatum] = useState(plusDays(14));
  const [omschrijving, setOmschrijving] = useState("");
  const [notities, setNotities] = useState("");
  const [lines, setLines] = useState<OfferteLijnInput[]>(() => {
    if (viewportFit && isDemo) return getDemoInvoiceLines();
    if (viewportFit) return [{ ...emptyLine }, { ...emptyLine }, { ...emptyLine }];
    return [{ ...emptyLine }];
  });
  const [taxRate, setTaxRate] = useState(21);
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState(() =>
    viewportFit && isDemo ? 40 : 0,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => lineTotals(lines), [lines]);
  const discountAmount = useMemo(() => {
    if (discountValue <= 0) return 0;
    return discountType === "fixed"
      ? discountValue
      : (totals.subtotaal * discountValue) / 100;
  }, [discountType, discountValue, totals.subtotaal]);
  const displayTotals = useMemo(
    () => ({
      subtotaal: totals.subtotaal,
      btw: totals.btw,
      totaal: Math.max(0, totals.totaal - discountAmount),
    }),
    [discountAmount, totals],
  );
  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c.id) === customerId),
    [customers, customerId],
  );
  const isProforma = documentType === "proforma";
  const klantNaam =
    selectedCustomer?.name?.trim() || klantVrij.trim() || "Nog geen klant";

  function updateLine(i: number, patch: Partial<OfferteLijnInput>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, { ...emptyLine }]);
  }
  function removeLine(i: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, idx) => idx !== i)));
  }

  function handleTaxRateChange(rate: number) {
    setTaxRate(rate);
    setLines((current) =>
      current.map((line) => ({ ...line, btw_percentage: rate })),
    );
  }

  async function handleSubmit(destination: "lijst" | "detail") {
    setError(null);

    const klant = selectedCustomer ? selectedCustomer.name : klantVrij.trim();
    if (!klant) {
      setError("Kies een klant of vul een klantnaam in.");
      setActiveTab("factuur");
      return;
    }
    if (!hasValidLines(lines)) {
      setError("Voeg minstens één factuurlijn toe.");
      setActiveTab("factuur");
      return;
    }

    setLoading(true);
    const res = await createFactuur({
      documentType,
      customerId: selectedCustomer ? selectedCustomer.id : null,
      klant,
      datum,
      vervaldatum: isProforma ? null : vervaldatum,
      omschrijving,
      notities,
      lines,
    });
    setLoading(false);

    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("id" in res && res.id) {
      if (destination === "detail") {
        router.push(`/dashboard/facturen/${res.id}`);
      } else {
        router.push("/dashboard/facturen");
      }
      router.refresh();
    }
  }

  const b = documentContext.bedrijf;
  const actionButtons = (
    <>
      <Button
        type="button"
        disabled={loading}
        variant="ghost"
        size={viewportFit ? "sm" : undefined}
        onClick={() => void handleSubmit("lijst")}
      >
        <Save size={14} />
        Opslaan als concept
      </Button>
      <Button
        type="button"
        disabled={loading}
        variant="default"
        size={viewportFit ? "sm" : undefined}
        className={viewportFit ? "border-zinc-200 bg-zinc-100 text-zinc-950 hover:bg-white" : undefined}
        onClick={() => void handleSubmit("detail")}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={15} />
        )}
        {isProforma ? "Proforma versturen" : "Factuur versturen"}
      </Button>
    </>
  );

  if (viewportFit) {
    return (
      <InvoiceCreateView
        activeTab={activeTab}
        onTabChange={setActiveTab}
        documentType={documentType}
        onDocumentTypeChange={setDocumentType}
        reference={previewReference(documentType)}
        datum={datum}
        onDatumChange={setDatum}
        vervaldatum={vervaldatum}
        onVervaldatumChange={setVervaldatum}
        isProforma={isProforma}
        customers={customers}
        customerId={customerId}
        onCustomerIdChange={setCustomerId}
        klantVrij={klantVrij}
        onKlantVrijChange={setKlantVrij}
        klantNaam={klantNaam}
        klantEmail={
          selectedCustomer?.email ||
          selectedCustomer?.company_name ||
          "Geen contactgegevens"
        }
        klantInitials={customerInitials(klantNaam)}
        lines={lines}
        onUpdateLine={updateLine}
        onAddLine={addLine}
        onRemoveLine={removeLine}
        taxRate={taxRate}
        onTaxRateChange={handleTaxRateChange}
        discountType={discountType}
        onDiscountTypeChange={setDiscountType}
        discountValue={discountValue}
        onDiscountValueChange={setDiscountValue}
        subtotaal={displayTotals.subtotaal}
        btw={displayTotals.btw}
        totaal={displayTotals.totaal}
        bedrijf={b}
        documentContext={documentContext}
        omschrijving={omschrijving}
        onOmschrijvingChange={setOmschrijving}
        notities={notities}
        onNotitiesChange={setNotities}
        loading={loading}
        error={error}
        isDemo={isDemo}
        onSaveDraft={() => void handleSubmit("lijst")}
        onSend={() => void handleSubmit("detail")}
      />
    );
  }

  const invoiceTab = (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-200">
          Documenttype
        </label>
        <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-zinc-950/60 p-1">
          <DocTypeButton
            active={documentType === "factuur"}
            onClick={() => setDocumentType("factuur")}
            icon={<FileText size={15} />}
            label="Factuur"
            activeClass="bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/40"
          />
          <DocTypeButton
            active={isProforma}
            onClick={() => setDocumentType("proforma")}
            icon={<FileClock size={15} />}
            label="Proforma"
            activeClass="bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/40"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-200">
            Referentienummer
          </label>
          <Input
            value={previewReference(documentType)}
            readOnly
            className="font-mono text-zinc-500"
          />
          <p className="mt-1 text-[11px] text-zinc-600">
            Definitief nummer bij opslaan
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-200">
            Factuurdatum
          </label>
          <Input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-200">
            Vervaldatum
          </label>
          <Input
            type="date"
            value={vervaldatum}
            onChange={(e) => setVervaldatum(e.target.value)}
            disabled={isProforma}
            className="disabled:cursor-not-allowed disabled:opacity-40"
          />
        </div>
      </div>

      <Card className="border-white/10 bg-zinc-950/40">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base">Factuur aan</CardTitle>
            <CardDescription>
              Selecteer een klant of voeg een nieuwe toe
            </CardDescription>
          </div>
          <Link
            href="/dashboard/contacten"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300"
          >
            <UserPlus size={14} />
            Nieuwe klant
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {customers.length > 0 ? (
            <Select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">— Kies een klant —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company_name ? ` (${c.company_name})` : ""}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              value={klantVrij}
              onChange={(e) => setKlantVrij(e.target.value)}
              placeholder="Naam van de klant"
            />
          )}

          {customers.length > 0 && customerId === "" && (
            <Input
              value={klantVrij}
              onChange={(e) => setKlantVrij(e.target.value)}
              placeholder="…of typ een nieuwe klantnaam"
            />
          )}

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/50 p-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-sky-400/30 bg-sky-500/10 font-mono text-sm font-semibold text-sky-300">
              {customerInitials(klantNaam) || "?"}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-100">{klantNaam}</p>
              <p className="truncate text-xs text-zinc-500">
                {selectedCustomer?.email ||
                  selectedCustomer?.company_name ||
                  "Geen contactgegevens"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-zinc-950/40">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base">Factuurlijnen</CardTitle>
            <CardDescription>Omschrijving, aantal, prijs en BTW</CardDescription>
          </div>
          <Button type="button" variant="ghost" onClick={addLine}>
            <Plus size={14} />
            Lijn toevoegen
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 p-0 sm:p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[180px]">Omschrijving</TableHead>
                  <TableHead className="w-20">Aantal</TableHead>
                  <TableHead className="w-24">Eenheid</TableHead>
                  <TableHead className="w-28 text-right">Prijs</TableHead>
                  <TableHead className="w-20 text-right">BTW</TableHead>
                  <TableHead className="w-28 text-right">Totaal</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l, i) => {
                  const lineTotal =
                    (Number(l.aantal) || 0) * (Number(l.prijs_per_eenheid) || 0);
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          value={l.omschrijving}
                          onChange={(e) =>
                            updateLine(i, { omschrijving: e.target.value })
                          }
                          placeholder="Omschrijving"
                          className="min-w-[160px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          value={l.aantal}
                          onChange={(e) =>
                            updateLine(i, { aantal: Number(e.target.value) })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={l.eenheid}
                          onChange={(e) =>
                            updateLine(i, { eenheid: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          value={l.prijs_per_eenheid}
                          onChange={(e) =>
                            updateLine(i, {
                              prijs_per_eenheid: Number(e.target.value),
                            })
                          }
                          className="text-right font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          max={100}
                          value={l.btw_percentage}
                          onChange={(e) =>
                            updateLine(i, {
                              btw_percentage: Number(e.target.value),
                            })
                          }
                          className="text-right font-mono"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono text-zinc-200">
                        {formatEuro(lineTotal)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLine(i)}
                          disabled={lines.length === 1}
                          aria-label="Lijn verwijderen"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-zinc-950/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aanpassingen</CardTitle>
          <CardDescription>BTW en totalen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ml-auto max-w-sm space-y-2 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotaal</span>
              <span className="font-mono">{formatEuro(totals.subtotaal)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>BTW</span>
              <span className="font-mono">{formatEuro(totals.btw)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold text-zinc-100">
              <span>Te betalen</span>
              <span className="font-mono">{formatEuro(totals.totaal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-200">
          Omschrijving (optioneel)
        </label>
        <Input
          value={omschrijving}
          onChange={(e) => setOmschrijving(e.target.value)}
          placeholder="bijv. Werken maand juli"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-200">
          Notities (optioneel)
        </label>
        <textarea
          value={notities}
          onChange={(e) => setNotities(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10"
        />
      </div>
    </div>
  );

  const paymentTab = (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Betalingsgegevens die op de factuur verschijnen. Wijzig ze bij{" "}
        <Link href="/dashboard/instellingen" className="text-sky-400 hover:text-sky-300">
          Instellingen
        </Link>
        .
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "IBAN", value: b.iban },
          { label: "Betalingsreferentie", value: previewReference(documentType) },
          { label: "Vervaldatum", value: isProforma ? "—" : vervaldatum },
          { label: "BTW-nummer", value: b.btw },
        ].map((field) => (
          <div
            key={field.label}
            className="rounded-xl border border-white/10 bg-zinc-900/40 px-3.5 py-2.5"
          >
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              {field.label}
            </p>
            <p className="mt-0.5 truncate font-mono text-sm text-zinc-200">
              {field.value || "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const bedrijfTab = (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Bedrijfsgegevens op de factuur. Wijzig ze bij{" "}
        <Link href="/dashboard/instellingen" className="text-sky-400 hover:text-sky-300">
          Instellingen
        </Link>
        .
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Bedrijfsnaam", value: b.naam },
          { label: "BTW-nummer", value: b.btw },
          { label: "Adres", value: b.adres },
          {
            label: "Stad",
            value: [b.postcode, b.stad].filter(Boolean).join(" ") || null,
          },
          { label: "E-mail", value: b.email },
          { label: "Telefoon", value: b.telefoon },
        ].map((field) => (
          <div
            key={field.label}
            className="rounded-xl border border-white/10 bg-zinc-900/40 px-3.5 py-2.5"
          >
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              {field.label}
            </p>
            <p className="mt-0.5 truncate text-sm text-zinc-200">
              {field.value || "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {!embedded && (
        <Link
          href="/dashboard/facturen"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← Terug naar facturen
        </Link>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="hidden sm:block" />
        <div className="flex flex-wrap items-center gap-2">{actionButtons}</div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap gap-1.5 border-b border-white/10 p-2">
            <TabButton
              active={activeTab === "factuur"}
              onClick={() => setActiveTab("factuur")}
              icon={<ReceiptText size={14} />}
              label="Factuur"
            />
            <TabButton
              active={activeTab === "betaling"}
              onClick={() => setActiveTab("betaling")}
              icon={<CreditCard size={14} />}
              label="Betaling"
            />
            <TabButton
              active={activeTab === "bedrijf"}
              onClick={() => setActiveTab("bedrijf")}
              icon={<Building2 size={14} />}
              label="Bedrijf"
            />
          </div>
          <CardContent className="p-5">
            {activeTab === "factuur" && invoiceTab}
            {activeTab === "betaling" && paymentTab}
            {activeTab === "bedrijf" && bedrijfTab}
          </CardContent>
        </Card>

        <div className="xl:sticky xl:top-24">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle className="text-base">Preview</CardTitle>
                <CardDescription>Live voorbeeld van je factuur</CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <Button type="button" variant="ghost" size="sm" disabled>
                  <Printer size={14} />
                  Afdrukken
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled>
                  <Download size={14} />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Badge variant="info" className="mb-3">
                Live preview
              </Badge>
              <FactuurDocumentPreview
                templateId={documentContext.templateId}
                defaultTemplate={documentContext.defaultTemplate}
                bedrijf={documentContext.bedrijf}
                customers={customers}
                customerId={customerId}
                klantVrij={klantVrij}
                documentType={documentType}
                datum={datum}
                vervaldatum={isProforma ? null : vervaldatum}
                omschrijving={omschrijving}
                notities={notities}
                lines={lines}
                nummer={previewReference(documentType)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors ${
        compact ? "px-2.5 py-1.5 text-xs" : "rounded-xl px-3.5 py-2 text-sm"
      } ${
        active
          ? "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/40"
          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DocTypeButton({
  active,
  onClick,
  icon,
  label,
  activeClass,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeClass: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 items-center justify-center gap-1.5 font-medium transition-colors ${
        compact ? "rounded-md px-2 py-1.5 text-xs" : "rounded-lg px-3 py-2 text-sm"
      } ${
        active ? activeClass : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
