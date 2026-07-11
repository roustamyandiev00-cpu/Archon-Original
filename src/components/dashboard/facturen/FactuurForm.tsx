"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createFactuur } from "@/app/dashboard/facturen/actions";
import InvoiceCreateView, {
  getDemoInvoiceLines,
} from "@/components/dashboard/facturen/InvoiceCreateView";
import { studioRateFromTaxId } from "@/components/dashboard/facturen/studio/studio-invoice-data";
import { type OfferteLijnInput } from "@/lib/offertes";
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

export default function FactuurForm({
  customers,
  documentContext,
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
  const studioLayout = viewportFit;
  const [activeTab, setActiveTab] = useState<"invoice" | "payment" | "business">(
    "invoice",
  );

  const [reference, setReference] = useState(() =>
    studioLayout ? "FL-0425" : "FL-0425",
  );
  const [customerId, setCustomerId] = useState<string>("");
  const [klantVrij, setKlantVrij] = useState(() =>
    studioLayout ? "AIY Cap" : "",
  );
  const [datum, setDatum] = useState(today());
  const [vervaldatum, setVervaldatum] = useState(plusDays(14));
  const [lines, setLines] = useState<OfferteLijnInput[]>(() => {
    if (studioLayout) return getDemoInvoiceLines();
    return [{ ...emptyLine }];
  });
  const [taxId, setTaxId] = useState(() => (studioLayout ? "vat" : "vat"));
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState(() =>
    studioLayout ? 40 : 0,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taxRate = studioRateFromTaxId(taxId);
  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c.id) === customerId),
    [customers, customerId],
  );
  const klantNaam =
    selectedCustomer?.name?.trim() || klantVrij.trim() || "AIY Cap";
  const klantEmail =
    selectedCustomer?.email ||
    (studioLayout ? "finance@aiycap.com" : "No contact details");

  function updateLine(i: number, patch: Partial<OfferteLijnInput>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, { ...emptyLine, btw_percentage: taxRate }]);
  }
  function removeLine(i: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, idx) => idx !== i)));
  }

  function handleTaxIdChange(nextTaxId: string) {
    setTaxId(nextTaxId);
    const rate = studioRateFromTaxId(nextTaxId);
    setLines((current) =>
      current.map((line) => ({ ...line, btw_percentage: rate })),
    );
  }

  async function handleSubmit(destination: "lijst" | "detail") {
    setError(null);

    const klant = selectedCustomer ? selectedCustomer.name : klantVrij.trim();
    if (!klant) {
      setError("Choose a client or enter a client name.");
      setActiveTab("invoice");
      return;
    }
    if (!hasValidLines(lines)) {
      setError("Add at least one invoice line.");
      setActiveTab("invoice");
      return;
    }

    setLoading(true);
    const res = await createFactuur({
      documentType: "factuur",
      customerId: selectedCustomer ? selectedCustomer.id : null,
      klant,
      datum,
      vervaldatum,
      omschrijving: "",
      notities: "",
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
        router.push("/dashboard/facturen/lijst");
      }
      router.refresh();
    }
  }

  return (
    <InvoiceCreateView
      activeTab={activeTab}
      onTabChange={setActiveTab}
      reference={reference}
      onReferenceChange={setReference}
      datum={datum}
      onDatumChange={setDatum}
      vervaldatum={vervaldatum}
      onVervaldatumChange={setVervaldatum}
      customers={customers}
      customerId={customerId}
      onCustomerIdChange={setCustomerId}
      klantVrij={klantVrij}
      onKlantVrijChange={setKlantVrij}
      klantNaam={klantNaam}
      klantEmail={klantEmail}
      lines={lines}
      onUpdateLine={updateLine}
      onAddLine={addLine}
      onRemoveLine={removeLine}
      taxId={taxId}
      onTaxIdChange={handleTaxIdChange}
      discountType={discountType}
      onDiscountTypeChange={setDiscountType}
      discountValue={discountValue}
      onDiscountValueChange={setDiscountValue}
      bedrijf={documentContext.bedrijf}
      documentContext={documentContext}
      loading={loading}
      error={error}
      useStudioDemoFrom={studioLayout}
      onSaveDraft={() => void handleSubmit("lijst")}
      onSend={() => void handleSubmit("detail")}
    />
  );
}
