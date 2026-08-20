"use client";

import * as React from "react";
import { Download, Printer } from "lucide-react";
import StudioInvoicePaper from "@/components/dashboard/facturen/studio/StudioInvoicePaper";
import {
  STUDIO_INVOICE_PAPER_HEIGHT,
  STUDIO_INVOICE_PAPER_WIDTH,
  type StudioInvoiceFormValues,
} from "@/components/dashboard/facturen/studio/studio-invoice-data";
import { Button } from "@/components/ui/button";

export default function StudioInvoicePreview({
  invoice,
}: {
  invoice: StudioInvoiceFormValues;
}) {
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.42);

  React.useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const update = () => {
      const pad = 20;
      const w = Math.max(0, el.clientWidth - pad * 2);
      const h = Math.max(0, el.clientHeight - pad * 2);
      if (w < 4 || h < 4) return;
      const next = Math.min(w / STUDIO_INVOICE_PAPER_WIDTH, h / STUDIO_INVOICE_PAPER_HEIGHT);
      setScale(Number.isFinite(next) ? Math.max(0.15, Math.min(next, 0.85)) : 0.42);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="studio-invoice-preview flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-950/50">
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
            className="h-7 border border-white/10 bg-white/[0.04] px-2 text-xs text-zinc-200 hover:bg-white/[0.08]"
          >
            <Download size={14} />
            PDF
          </Button>
        </div>
      </div>

      <div
        ref={bodyRef}
        className="relative min-h-0 flex-1 overflow-hidden bg-zinc-900/80"
      >
        <div className="absolute inset-0 grid place-items-center p-3">
          <div
            style={{
              width: STUDIO_INVOICE_PAPER_WIDTH * scale,
              height: STUDIO_INVOICE_PAPER_HEIGHT * scale,
            }}
            className="overflow-hidden bg-white shadow-xl shadow-black/40"
          >
            <div
              style={{
                width: STUDIO_INVOICE_PAPER_WIDTH,
                height: STUDIO_INVOICE_PAPER_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <StudioInvoicePaper invoice={invoice} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
