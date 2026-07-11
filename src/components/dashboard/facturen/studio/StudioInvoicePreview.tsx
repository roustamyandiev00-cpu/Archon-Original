"use client";

import * as React from "react";
import { Download, Printer } from "lucide-react";
import StudioInvoicePaper from "@/components/dashboard/facturen/studio/StudioInvoicePaper";
import {
  STUDIO_INVOICE_PAPER_HEIGHT,
  STUDIO_INVOICE_PAPER_SCALE,
  STUDIO_INVOICE_PAPER_WIDTH,
  type StudioInvoiceFormValues,
} from "@/components/dashboard/facturen/studio/studio-invoice-data";
import { useVisibleCenterPosition } from "@/components/dashboard/facturen/useVisibleCenterPosition";
import { Button } from "@/components/ui/button";

export default function StudioInvoicePreview({
  invoice,
}: {
  invoice: StudioInvoiceFormValues;
}) {
  const previewBodyRef = React.useRef<HTMLDivElement>(null);
  const paperLayout = useVisibleCenterPosition(previewBodyRef, {
    height: STUDIO_INVOICE_PAPER_HEIGHT,
    maxScale: STUDIO_INVOICE_PAPER_SCALE,
    width: STUDIO_INVOICE_PAPER_WIDTH,
  });

  return (
    <div className="studio-invoice-preview flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex shrink-0 items-center justify-between px-4 py-4">
        <h2 className="text-lg font-medium text-zinc-900">Preview</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 border border-zinc-200 bg-white px-3 text-zinc-900 hover:bg-zinc-50"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Print
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 border border-zinc-200 bg-white px-3 text-zinc-900 hover:bg-zinc-50"
          >
            <Download size={16} />
            Download PDF
          </Button>
        </div>
      </div>

      <div
        ref={previewBodyRef}
        className="@container/preview relative min-h-0 flex-1 overflow-hidden rounded-b-xl bg-stone-200 p-4"
      >
        {paperLayout === null ? (
          <div className="absolute inset-0 grid place-items-center text-sm text-zinc-500">
            Loading Preview
          </div>
        ) : null}
        <div
          style={{
            height: paperLayout
              ? STUDIO_INVOICE_PAPER_HEIGHT * paperLayout.scale
              : STUDIO_INVOICE_PAPER_HEIGHT * STUDIO_INVOICE_PAPER_SCALE,
            top: paperLayout?.top ?? "50%",
            transform:
              paperLayout === null ? "translate(-50%, -50%)" : "translateX(-50%)",
            width: paperLayout
              ? STUDIO_INVOICE_PAPER_WIDTH * paperLayout.scale
              : STUDIO_INVOICE_PAPER_WIDTH * STUDIO_INVOICE_PAPER_SCALE,
          }}
          className="absolute left-1/2 opacity-0 data-[ready=true]:opacity-100"
          data-ready={paperLayout !== null}
        >
          <div
            style={{
              transform: `scale(${paperLayout?.scale ?? STUDIO_INVOICE_PAPER_SCALE})`,
            }}
            className="origin-top-left"
          >
            <StudioInvoicePaper invoice={invoice} />
          </div>
        </div>
      </div>
    </div>
  );
}
