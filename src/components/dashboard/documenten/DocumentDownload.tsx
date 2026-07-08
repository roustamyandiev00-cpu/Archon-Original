"use client";

import { useState, useTransition } from "react";
import { Check, Download, FileText, Loader2, Star } from "lucide-react";
import { saveDefaultTemplate } from "@/app/dashboard/instellingen/actions";
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
  defaultTemplate,
  values,
  rows,
}: {
  kind: DocumentKind;
  defaultTemplate: string;
  values: Record<string, string>;
  rows: DocumentRow[];
}) {
  const [template, setTemplate] = useState(resolveTemplateId(defaultTemplate));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDocument(autoPrint: boolean) {
    const html = buildDocumentHtml(template, kind, values, rows, { autoPrint });
    const w = window.open("", "_blank");
    if (!w) {
      setError("Sta pop-ups toe om het document te openen.");
      return;
    }
    setError(null);
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  function saveAsDefault() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveDefaultTemplate(kind, template);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
    });
  }

  const label = kind === "quote" ? "offerte" : "factuur";

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
            onClick={() => openDocument(true)}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400"
          >
            <Download size={15} /> Download PDF
          </button>
          <button
            type="button"
            onClick={() => openDocument(false)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
          >
            Voorbeeld
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveAsDefault}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-sky-500/40 hover:bg-sky-500/10 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Opslaan…
            </>
          ) : (
            <>
              <Star size={13} /> Als standaard opslaan
            </>
          )}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
            <Check size={13} /> Opgeslagen als standaard
          </span>
        )}
        {error && <span className="text-xs text-rose-400">{error}</span>}
      </div>

      <p className="mt-3 text-[11px] text-zinc-500">
        Tip: kies bij het afdrukvenster “Opslaan als PDF”. Zet marges op “Geen”
        voor het beste resultaat.
      </p>
    </div>
  );
}
