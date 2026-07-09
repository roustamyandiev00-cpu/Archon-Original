"use client";

import { useState, useTransition } from "react";
import { Check, Download, Eye, FileText, Loader2, Save } from "lucide-react";
import { saveDocumentTemplate } from "@/app/dashboard/instellingen/actions";
import {
  buildDocumentHtml,
  resolveTemplateId,
  RENDERABLE_TEMPLATES,
  type DocumentKind,
  type DocumentRow,
} from "@/components/dashboard/documenten/documentTemplate";

const selectClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-sky-500/60";

export default function DocumentDownload({
  kind,
  documentId,
  currentTemplate,
  values,
  rows,
}: {
  kind: DocumentKind;
  documentId: number;
  currentTemplate: string;
  values: Record<string, string>;
  rows: DocumentRow[];
}) {
  const [template, setTemplate] = useState(resolveTemplateId(currentTemplate));
  const [pending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = kind === "quote" ? "offerte" : "factuur";
  const pdfBase =
    kind === "quote"
      ? `/dashboard/offertes/${documentId}/pdf`
      : `/dashboard/facturen/${documentId}/pdf`;

  function downloadPdf() {
    setError(null);
    setDownloading(true);
    const url = `${pdfBase}?template=${encodeURIComponent(template)}`;
    // De route stuurt Content-Disposition: attachment, dus dit start de download.
    window.location.href = url;
    // Reset de status kort daarna (de navigatie blijft op dezelfde pagina).
    setTimeout(() => setDownloading(false), 4000);
  }

  function preview() {
    const html = buildDocumentHtml(template, kind, values, rows);
    const w = window.open("", "_blank");
    if (!w) {
      setError("Sta pop-ups toe om het voorbeeld te openen.");
      return;
    }
    setError(null);
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  function saveTemplate() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveDocumentTemplate(kind, documentId, template);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
        <FileText size={15} className="text-sky-400" />
        Sjabloon & download
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500">
        Kies een sjabloon en download deze {label} als PDF.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-300">
            Sjabloon
          </label>
          <select
            value={template}
            onChange={(e) => {
              setTemplate(e.target.value);
              setSaved(false);
            }}
            className={selectClass}
          >
            {RENDERABLE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:opacity-60"
          >
            {downloading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> PDF maken…
              </>
            ) : (
              <>
                <Download size={15} /> Download PDF
              </>
            )}
          </button>
          <button
            type="button"
            onClick={preview}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
          >
            <Eye size={15} /> Voorbeeld
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveTemplate}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-sky-500/40 hover:bg-sky-500/10 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Opslaan…
            </>
          ) : (
            <>
              <Save size={13} /> Sjabloon opslaan voor deze {label}
            </>
          )}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
            <Check size={13} /> Opgeslagen
          </span>
        )}
        {error && <span className="text-xs text-rose-400">{error}</span>}
      </div>
    </div>
  );
}
