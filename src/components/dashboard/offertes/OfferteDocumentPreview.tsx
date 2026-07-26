"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import {
  buildDocumentHtml,
  resolveDocumentTemplateId,
} from "@/components/dashboard/documenten/documentTemplate";
import { archonTemplateMeta } from "@/components/dashboard/instellingen/templatePreview";
import {
  buildDocumentRows,
  buildDocumentValues,
  type BedrijfLite,
  type CustomerLite,
} from "@/lib/documentData";
import type { OfferteLijnInput } from "@/lib/offertes";

/** A4 @ 96dpi — zelfde als Instellingen-sjabloonpreview. */
const A4_W = 794;
const A4_H = 1123;

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

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function DocumentFrame({
  html,
  scale,
  maxHeight,
  className,
}: {
  html: string;
  scale: number;
  maxHeight: number;
  className?: string;
}) {
  return (
    <div
      className={`overflow-auto rounded-lg bg-zinc-900/40 ${className ?? ""}`}
      style={{ maxHeight }}
    >
      <div
        className="relative mx-auto bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]"
        style={{
          width: A4_W * scale,
          height: A4_H * scale,
        }}
      >
        <iframe
          title="Offertevoorbeeld"
          srcDoc={html}
          tabIndex={-1}
          className="absolute left-0 top-0 origin-top-left border-0 bg-white"
          style={{
            width: A4_W,
            height: A4_H,
            transform: `scale(${scale})`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Read-only A4-weergave voor een reeds opgeslagen offerte. Dezelfde HTML gaat
 * ook naar de PDF-renderer, zodat het detailbeeld het gekozen sjabloon volgt.
 */
export function OfferteDocumentSheet({ html }: { html: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const update = () => {
      const widthScale = (el.clientWidth - 16) / A4_W;
      const heightScale = (window.innerHeight - 190) / A4_H;
      setScale(Math.min(Math.max(Math.min(widthScale, heightScale), 0.25), 1));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      ref={boxRef}
      className="flex min-h-0 w-full justify-center overflow-auto rounded-2xl border border-white/10 bg-zinc-900/60 p-2 sm:p-4"
    >
      <div
        className="relative shrink-0 overflow-hidden bg-white shadow-[0_24px_80px_-28px_rgba(0,0,0,0.9)]"
        style={{ width: A4_W * scale, height: A4_H * scale }}
      >
        <iframe
          title="Offerte volgens gekozen sjabloon"
          srcDoc={html}
          tabIndex={-1}
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white"
          style={{
            width: A4_W,
            height: A4_H,
            transform: `scale(${scale})`,
          }}
        />
      </div>
    </div>
  );
}

function ZoomControls({
  zoom,
  onZoomOut,
  onZoomIn,
  onReset,
  onFullscreen,
}: {
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onReset: () => void;
  onFullscreen: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Zoom uit"
        onClick={onZoomOut}
        className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5"
      >
        <Minus size={14} />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="min-w-[3.25rem] rounded-lg border border-white/10 px-2 py-1.5 text-[11px] font-medium tabular-nums text-zinc-300 hover:bg-white/5"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        onClick={onZoomIn}
        className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5"
      >
        <Plus size={14} />
      </button>
      <button
        type="button"
        onClick={onFullscreen}
        className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-[11px] font-medium text-zinc-200 hover:bg-white/5"
      >
        <Maximize2 size={13} />
        Vergroten
      </button>
    </div>
  );
}

export default function OfferteDocumentPreview({
  templateId,
  defaultTemplate,
  bedrijf,
  customers,
  customerId,
  klantVrij,
  datum,
  geldigTot,
  notes,
  lines,
  nummer,
  embedded = false,
}: {
  templateId?: string;
  defaultTemplate: string;
  bedrijf: BedrijfLite;
  customers: PreviewCustomer[];
  customerId: string;
  klantVrij: string;
  datum: string;
  geldigTot: string;
  notes: string;
  lines: OfferteLijnInput[];
  nummer?: string;
  embedded?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.55);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [panelMaxHeight, setPanelMaxHeight] = useState(560);

  const renderId = resolveDocumentTemplateId(templateId, defaultTemplate);
  const templateLabel = archonTemplateMeta(renderId)?.label ?? "Sjabloon";

  const previewInput = useMemo(
    () => ({
      customerId,
      klantVrij,
      datum,
      geldigTot,
      notes,
      lines,
      nummer,
      renderId,
      bedrijf,
      customers,
    }),
    [
      bedrijf,
      customerId,
      customers,
      datum,
      geldigTot,
      klantVrij,
      lines,
      notes,
      nummer,
      renderId,
    ],
  );

  const debouncedInput = useDebouncedValue(previewInput, 280);
  const updating = previewInput !== debouncedInput;

  const html = useMemo(() => {
    const selected = debouncedInput.customers.find(
      (c) => String(c.id) === debouncedInput.customerId,
    );
    const klant =
      selected?.name?.trim() ||
      debouncedInput.klantVrij.trim() ||
      "Klant";

    const customer: CustomerLite = selected
      ? {
          name: selected.name,
          company_name: selected.company_name,
          first_name: selected.first_name ?? null,
          last_name: selected.last_name ?? null,
          address: selected.address ?? null,
          email: selected.email ?? null,
          phone: selected.phone ?? null,
          btw: selected.btw ?? null,
        }
      : null;

    const docLines = debouncedInput.lines.map((l) => ({
      omschrijving: l.omschrijving,
      aantal: Number(l.aantal) || 0,
      eenheid: l.eenheid,
      prijs_per_eenheid: Number(l.prijs_per_eenheid) || 0,
      btw_percentage: Number(l.btw_percentage) || 0,
    }));

    const values = buildDocumentValues(
      {
        kind: "quote",
        nummer: debouncedInput.nummer ?? "Concept",
        datum: debouncedInput.datum,
        geldig_tot: debouncedInput.geldigTot,
        notes: debouncedInput.notes,
        klant,
      },
      debouncedInput.bedrijf,
      customer,
      docLines,
    );
    const rows = buildDocumentRows(docLines);

    return buildDocumentHtml(debouncedInput.renderId, "quote", values, rows);
  }, [debouncedInput]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const update = () => {
      const widthScale = Math.max(0.35, el.clientWidth / A4_W);
      setFitScale(Math.min(widthScale, 1));
      setPanelMaxHeight(Math.max(420, window.innerHeight - (embedded ? 200 : 160)));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [embedded, fullscreen]);

  const scale = Math.min(Math.max(fitScale * zoom, 0.35), 1.6);

  const zoomControls = (
    <ZoomControls
      zoom={zoom}
      onZoomOut={() =>
        setZoom((z) => Math.max(0.7, Number((z - 0.1).toFixed(2))))
      }
      onZoomIn={() =>
        setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))
      }
      onReset={() => setZoom(1)}
      onFullscreen={() => setFullscreen(true)}
    />
  );

  const toolbar = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-zinc-100">Live preview</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/12 px-2.5 py-1 text-[11px] font-semibold text-sky-400">
          {updating ? (
            <>
              <Loader2 size={11} className="animate-spin" /> Bijwerken…
            </>
          ) : (
            <>
              <RefreshCw size={11} /> Bijgewerkt
            </>
          )}
        </span>
      </div>
      {zoomControls}
    </div>
  );

  const frame = (
    <div ref={boxRef} className="min-w-0">
      <DocumentFrame html={html} scale={scale} maxHeight={panelMaxHeight} />
      <p className="mt-3 text-center text-[11px] text-zinc-600">
        Sjabloon: {templateLabel}
      </p>
    </div>
  );

  return (
    <>
      {embedded ? (
        <div className="flex min-w-0 flex-1 flex-col">
          {toolbar}
          {frame}
        </div>
      ) : (
        <div className="lg:sticky lg:top-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              <Eye size={15} className="text-sky-400" />
              Sjabloonvoorbeeld
            </h2>
            {zoomControls}
          </div>
          {frame}
        </div>
      )}

      {fullscreen && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-zinc-950/95 p-4 backdrop-blur-sm sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-100">Preview vergroten</p>
              <p className="text-xs text-zinc-500">
                Controleer de volledige offerte vóór opslaan of versturen.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {zoomControls}
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-zinc-300 hover:bg-white/5"
                aria-label="Sluiten"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-white/10 bg-zinc-900/40 p-4">
            <DocumentFrame
              html={html}
              scale={Math.min(Math.max(zoom * 0.85, 0.5), 1.4)}
              maxHeight={
                typeof window !== "undefined" ? window.innerHeight - 120 : 800
              }
              className="mx-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}
