"use client";

import * as React from "react";
import { Download, Printer } from "lucide-react";
import FactuurDocumentPreview, {
  FACTUUR_PAPER_HEIGHT,
  FACTUUR_PAPER_MAX_SCALE,
  FACTUUR_PAPER_WIDTH,
} from "@/components/dashboard/facturen/FactuurDocumentPreview";
import { Button } from "@/components/ui/button";
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
  discountAmount?: number;
  subtotaal?: number;
  btw?: number;
  totaal?: number;
  previewSubtotaal?: number;
  previewBtw?: number;
  previewTotaal?: number;
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
    <div className="studio-invoice-preview invoice-create-preview-shell flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-950/50">
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3">
        <h2 className="text-sm font-medium text-zinc-100">Voorbeeld</h2>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 border border-white/10 bg-white/[0.04] px-2 text-xs text-zinc-200 hover:bg-white/[0.08]"
            onClick={() => window.print()}
          >
            <Printer size={14} />
            Afdrukken
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled
            title="Beschikbaar zodra de factuur is opgeslagen"
            className="h-7 border border-white/10 bg-white/[0.04] px-2 text-xs text-zinc-400"
          >
            <Download size={14} />
            PDF
          </Button>
        </div>
      </div>

      <div
        ref={previewBodyRef}
        className="@container/preview invoice-preview-canvas relative min-h-[280px] flex-1 overflow-hidden bg-zinc-900/80 p-3 sm:min-h-[360px]"
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
            <FactuurDocumentPreview
              {...props}
              discountAmount={props.discountAmount}
              previewSubtotaal={props.previewSubtotaal ?? props.subtotaal}
              previewBtw={props.previewBtw ?? props.btw}
              previewTotaal={props.previewTotaal ?? props.totaal}
              bare
            />
          </div>
        </div>
      </div>
    </div>
  );
}
