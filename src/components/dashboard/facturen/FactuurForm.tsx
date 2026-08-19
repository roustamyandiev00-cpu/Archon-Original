"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createFactuur } from "@/app/dashboard/facturen/actions";
import { uploadProjectBestanden } from "@/app/dashboard/offertes/projecten/bestanden-actions";
import InvoiceCreateView, {
  getDemoInvoiceLines,
} from "@/components/dashboard/facturen/InvoiceCreateView";
import { customerDisplayName } from "@/components/dashboard/facturen/studio/studio-invoice-data";
import type { PrijslijstPickItem } from "@/components/dashboard/prijslijst/types";
import type { FacturenProjectOption } from "@/lib/facturen/load-facturen-data";
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
  projects = [],
  documentContext,
  prijslijstItems = [],
  isDemo = false,
}: {
  customers: Customer[];
  projects?: FacturenProjectOption[];
  documentContext: FactuurDocumentContext;
  prijslijstItems?: PrijslijstPickItem[];
  embedded?: boolean;
  isDemo?: boolean;
}) {
  const router = useRouter();
  const useDemoDefaults = isDemo;

  const [activeTab, setActiveTab] = useState<"invoice" | "payment" | "business">(
    "invoice",
  );

  const [reference, setReference] = useState(() =>
    useDemoDefaults ? "FL-0425" : "Concept",
  );
  const [customerId, setCustomerId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [klantVrij, setKlantVrij] = useState(() =>
    useDemoDefaults ? "AIY Cap" : "",
  );
  const [datum, setDatum] = useState(today());
  const [vervaldatum, setVervaldatum] = useState(plusDays(14));
  const [lines, setLines] = useState<OfferteLijnInput[]>(() => {
    if (useDemoDefaults) return getDemoInvoiceLines();
    return [{ ...emptyLine }];
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c.id) === customerId),
    [customers, customerId],
  );

  const filteredProjects = useMemo(() => {
    if (!customerId) return projects;
    const cid = Number(customerId);
    const matched = projects.filter((p) => p.customer_id === cid);
    if (matched.length > 0) return matched;
    const naam = selectedCustomer
      ? customerDisplayName(selectedCustomer).toLowerCase()
      : "";
    if (!naam) return projects;
    return projects.filter(
      (p) =>
        p.klant_naam.toLowerCase().includes(naam) ||
        naam.includes(p.klant_naam.toLowerCase()),
    );
  }, [projects, customerId, selectedCustomer]);

  const klantNaam = selectedCustomer
    ? customerDisplayName(selectedCustomer)
    : klantVrij.trim() || (useDemoDefaults ? "AIY Cap" : "Klant");
  const klantEmail =
    selectedCustomer?.email ||
    (useDemoDefaults ? "finance@aiycap.com" : "Geen e-mail");

  function updateLine(i: number, patch: Partial<OfferteLijnInput>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, { ...emptyLine }]);
  }
  function removeLine(i: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, idx) => idx !== i)));
  }
  function addFromPrijslijst(item: PrijslijstPickItem) {
    const next: OfferteLijnInput = {
      omschrijving: item.omschrijving,
      aantal: 1,
      eenheid: item.eenheid || "stuks",
      prijs_per_eenheid: item.prijs,
      btw_percentage: item.btwPercentage,
    };
    setLines((ls) => {
      const last = ls[ls.length - 1];
      const lastEmpty =
        last &&
        last.omschrijving.trim() === "" &&
        Number(last.prijs_per_eenheid) === 0;
      if (lastEmpty) {
        return [...ls.slice(0, -1), next];
      }
      return [...ls, next];
    });
  }

  function handleCustomerIdChange(value: string) {
    setCustomerId(value);
    setProjectId("");
    if (value) {
      const c = customers.find((x) => String(x.id) === value);
      if (c) setKlantVrij(customerDisplayName(c));
    }
  }

  function handleFilesChange(files: File[]) {
    setPendingFiles(files);
  }

  async function handleSubmit(destination: "lijst" | "detail") {
    setError(null);

    const klant = selectedCustomer
      ? customerDisplayName(selectedCustomer)
      : klantVrij.trim();
    if (!klant) {
      setError("Kies een klant of vul een klantnaam in.");
      setActiveTab("invoice");
      return;
    }
    if (!hasValidLines(lines)) {
      setError("Voeg minstens één factuurlijn toe.");
      setActiveTab("invoice");
      return;
    }

    setLoading(true);
    const res = await createFactuur({
      documentType: "factuur",
      customerId: selectedCustomer ? selectedCustomer.id : null,
      projectId: projectId || null,
      klant,
      datum,
      vervaldatum,
      omschrijving: "",
      notities: "",
      lines,
    });

    if ("error" in res && res.error) {
      setLoading(false);
      setError(res.error);
      return;
    }

    if ("id" in res && res.id && pendingFiles.length > 0) {
      if (projectId || selectedCustomer?.id) {
        const fd = new FormData();
        pendingFiles.forEach((f) => fd.append("bestanden", f));
        await uploadProjectBestanden({
          projectId: projectId || null,
          customerId: selectedCustomer?.id ?? null,
          formData: fd,
        });
      }
    }

    setLoading(false);

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
      onCustomerIdChange={handleCustomerIdChange}
      klantVrij={klantVrij}
      onKlantVrijChange={setKlantVrij}
      klantNaam={klantNaam}
      klantEmail={klantEmail}
      projects={filteredProjects}
      projectId={projectId}
      onProjectIdChange={setProjectId}
      pendingFiles={pendingFiles}
      onPendingFilesChange={handleFilesChange}
      lines={lines}
      onUpdateLine={updateLine}
      onAddLine={addLine}
      onRemoveLine={removeLine}
      prijslijstItems={prijslijstItems}
      onPickPrijslijst={addFromPrijslijst}
      bedrijf={documentContext.bedrijf}
      documentContext={documentContext}
      loading={loading}
      error={error}
      isDemo={useDemoDefaults}
      onSaveDraft={() => void handleSubmit("lijst")}
      onSend={() => void handleSubmit("detail")}
    />
  );
}
