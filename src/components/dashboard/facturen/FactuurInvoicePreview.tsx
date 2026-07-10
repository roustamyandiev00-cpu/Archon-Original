"use client";

import * as React from "react";
import { Download, Printer } from "lucide-react";
import FactuurDocumentPreview, {
  FACTUUR_PAPER_HEIGHT,
  FACTUUR_PAPER_MAX_SCALE,
  FACTUUR_PAPER_WIDTH,
} from "@/components/dashboard/facturen/FactuurDocumentPreview";
import { Button } from "@/components/dashboard/admin/ui/button";
import type { FactuurDocumentType } from "@/lib/facturen";
import type { BedrijfLite } from "@/lib/documentData";
import type { OfferteLijnInput } from "@/lib/offertes";
import { useVisibleCenterPosition } from "@/components/dashboard/facturen/useVisibleCenterPosition";

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

type Props = {
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
  nummer: string;
};

/** Preview-paneel — layout gelijk aan Studio Admin / next-shadcn-admin-dashboard invoice. */
export default function FactuurInvoicePreview(props: Props) {
  const previewBodyRef = React.useRef<HTMLDivElement>(null);
  const paperLayout = useVisibleCenterPosition(previewBodyRef, {
    height: FACTUUR_PAPER_HEIGHT,
    maxScale: FACTUUR_PAPER_MAX_SCALE,
    width: FACTUUR_PAPER_WIDTH,
  });

  return (
    <div className="invoice-create-preview-shell flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200/80 px-4 py-4 dark:border-white/10">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Preview</h2>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm">
            <Printer size={14} />
            Afdrukken
          </Button>
          <Button type="button" variant="primary" size="sm" className="border-zinc-200 bg-zinc-100 text-zinc-950 hover:bg-white dark:border-white/20 dark:bg-zinc-100 dark:text-zinc-950">
            <Download size={14} />
            PDF downloaden
          </Button>
        </div>
      </div>

      <div
        ref={previewBodyRef}
        className="@container/preview invoice-preview-canvas relative min-h-[420px] flex-1 overflow-hidden rounded-b-xl bg-zinc-100/80 p-4 dark:bg-zinc-950/40 sm:min-h-[calc(100svh-15rem)]"
      >
        {paperLayout === null ? (
          <div className="absolute inset-0 grid place-items-center text-sm text-zinc-500">
            Preview laden…
          </div>
        ) : null}
        <div
          style={{
            height: paperLayout
              ? FACTUUR_PAPER_HEIGHT * paperLayout.scale
              : FACTUUR_PAPER_HEIGHT * FACTUUR_PAPER_MAX_SCALE,
            top: paperLayout?.top ?? "50%",
            transform:
              paperLayout === null ? "translate(-50%, -50%)" : "translateX(-50%)",
            width: paperLayout
              ? FACTUUR_PAPER_WIDTH * paperLayout.scale
              : FACTUUR_PAPER_WIDTH * FACTUUR_PAPER_MAX_SCALE,
          }}
          className="absolute left-1/2 opacity-0 data-[ready=true]:opacity-100"
          data-ready={paperLayout !== null}
        >
          <div
            style={{ transform: `scale(${paperLayout?.scale ?? FACTUUR_PAPER_MAX_SCALE})` }}
            className="origin-top-left"
          >
            <FactuurDocumentPreview {...props} bare />
          </div>
        </div>
      </div>
    </div>
  );
}
