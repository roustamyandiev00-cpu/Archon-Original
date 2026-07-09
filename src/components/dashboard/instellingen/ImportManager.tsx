"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  Upload,
} from "lucide-react";
import GlowCard from "@/components/dashboard/GlowCard";
import {
  executeDataImport,
  storeImportFile,
} from "@/app/dashboard/instellingen/import-actions";
import {
  CRM_PRESETS,
  csvTemplate,
  ENTITY_FIELDS,
  ENTITY_OPTIONS,
} from "@/components/dashboard/instellingen/import/fields";
import {
  IMPORT_ACCEPT,
  MAX_IMPORT_ROWS,
  autoMapColumns,
  buildPreview,
  countValidRows,
  parseImportFile,
} from "@/components/dashboard/instellingen/import/parse";
import type {
  CrmPreset,
  ImportEntity,
  ImportMapping,
  ImportResult,
} from "@/components/dashboard/instellingen/import/types";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500/60";

export default function ImportManager() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [entity, setEntity] = useState<ImportEntity>("customers");
  const [preset, setPreset] = useState<CrmPreset>("generic");
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [createMissingCustomers, setCreateMissingCustomers] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fields = ENTITY_FIELDS[entity];
  const preview = useMemo(
    () => (rows.length ? buildPreview(rows, entity, mapping) : []),
    [rows, entity, mapping],
  );

  const validCount = useMemo(
    () => (rows.length ? countValidRows(rows, entity, mapping) : 0),
    [rows, entity, mapping],
  );

  function resetFileState() {
    setFileName(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setParseError(null);
    setResult(null);
    setImportError(null);
  }

  function applyParsed(
    parsed: { headers: string[]; rows: Record<string, string>[] },
    name: string,
  ) {
    setFileName(name);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(autoMapColumns(parsed.headers, entity, preset));
    setParseError(null);
    setResult(null);
    setImportError(null);
  }

  async function handleFile(file: File) {
    resetFileState();
    const text = await file.text();
    const parsed = parseImportFile(text, file.name);
    if ("error" in parsed) {
      setParseError(parsed.error);
      return;
    }
    applyParsed(parsed, file.name);

    const fd = new FormData();
    fd.append("file", file);
    await storeImportFile(fd);
  }

  function downloadTemplate() {
    const csv = csvTemplate(entity);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archonpro-import-${entity}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleEntityChange(next: ImportEntity) {
    setEntity(next);
    resetFileState();
    if (headers.length) {
      setMapping(autoMapColumns(headers, next, preset));
    }
  }

  function handlePresetChange(next: CrmPreset) {
    setPreset(next);
    if (headers.length) {
      setMapping(autoMapColumns(headers, entity, next));
    }
  }

  function runImport() {
    setImportError(null);
    setResult(null);
    startTransition(async () => {
      const res = await executeDataImport({
        entity,
        rows,
        mapping,
        skipDuplicates,
        createMissingCustomers,
      });
      if ("error" in res && res.error) {
        setImportError(res.error);
        return;
      }
      if ("ok" in res && res.ok) {
        setResult(res);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-sm text-zinc-300">
        Importeer data uit een andere CRM of boekhoudpakket. Ondersteund:{" "}
        <span className="font-medium text-zinc-100">CSV, TSV en JSON</span>{" "}
        (max. {MAX_IMPORT_ROWS} rijen per import). Kolommen worden automatisch
        herkend — je kunt ze hieronder nog aanpassen.
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-200">Wat importeren?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ENTITY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleEntityChange(opt.id)}
                className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                  entity === opt.id
                    ? "border-sky-500/50 bg-sky-500/10"
                    : "border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                }`}
              >
                <p className="text-sm font-medium text-zinc-100">{opt.label}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-200">Bron-CRM</p>
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value as CrmPreset)}
            className={inputClass}
          >
            {CRM_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-zinc-500">
            {CRM_PRESETS.find((p) => p.id === preset)?.hint}
          </p>
        </div>
      </div>

      <GlowCard subtle innerClassName="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-100">Bestand uploaden</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Sleep een exportbestand of kies een bestand van je computer.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5"
            >
              <Download size={13} /> Voorbeeld-CSV
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3.5 py-1.5 text-xs font-medium text-zinc-950 hover:bg-sky-400"
            >
              <Upload size={13} /> Bestand kiezen
            </button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={IMPORT_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
          }}
          className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-zinc-950/40 px-6 py-10 transition-colors hover:border-sky-500/40 hover:bg-sky-500/[0.03]"
        >
          <FileUp size={28} className="text-zinc-500" />
          <p className="mt-3 text-sm text-zinc-300">
            {fileName ? fileName : "CSV, TSV of JSON — tot 15 MB"}
          </p>
          {rows.length > 0 && (
            <p className="mt-1 text-xs text-emerald-400">
              {rows.length} rij{rows.length === 1 ? "" : "en"} gelezen
              {rows.length >= MAX_IMPORT_ROWS ? ` (max. ${MAX_IMPORT_ROWS})` : ""}
            </p>
          )}
        </div>

        {parseError && (
          <p className="mt-3 text-sm text-rose-400">{parseError}</p>
        )}
      </GlowCard>

      {headers.length > 0 && (
        <>
          <div>
            <p className="mb-3 text-sm font-medium text-zinc-200">
              Kolomkoppeling
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-xs text-zinc-400">
                    {field.label}
                    {field.required && (
                      <span className="text-rose-400"> *</span>
                    )}
                  </label>
                  <select
                    value={mapping[field.key] ?? ""}
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        [field.key]: e.target.value || null,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">— Niet importeren —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  {field.hint && (
                    <p className="mt-1 text-[11px] text-zinc-600">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
            <p className="text-sm font-medium text-zinc-200">Importopties</p>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="mt-0.5 accent-sky-500"
              />
              <span className="text-sm text-zinc-300">
                Dubbele records overslaan (zelfde e-mail, naam of documentnummer)
              </span>
            </label>
            {entity !== "customers" && (
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={createMissingCustomers}
                  onChange={(e) => setCreateMissingCustomers(e.target.checked)}
                  className="mt-0.5 accent-sky-500"
                />
                <span className="text-sm text-zinc-300">
                  Ontbrekende klanten automatisch aanmaken bij offertes/facturen
                </span>
              </label>
            )}
          </div>

          {preview.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-200">
                Voorbeeld (eerste rijen)
              </p>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="min-w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-zinc-900/80 text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      {fields.map((f) => (
                        <th key={f.key} className="px-3 py-2">
                          {f.label}
                        </th>
                      ))}
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row) => (
                      <tr
                        key={row.index}
                        className="border-b border-white/5 text-zinc-300"
                      >
                        <td className="px-3 py-2 font-mono text-zinc-500">
                          {row.index + 1}
                        </td>
                        {fields.map((f) => (
                          <td key={f.key} className="max-w-[160px] truncate px-3 py-2">
                            {row.values[f.key] || "—"}
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 size={12} /> OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400">
                              <AlertCircle size={12} /> {row.issues[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">
              {validCount} van {rows.length} rijen klaar om te importeren
            </p>
            <button
              type="button"
              disabled={pending || validCount === 0}
              onClick={runImport}
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-medium text-zinc-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Importeren…
                </>
              ) : (
                <>
                  <Upload size={16} /> {rows.length} rijen importeren
                </>
              )}
            </button>
          </div>

          {importError && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {importError}
            </p>
          )}

          {result && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              <p className="font-medium">
                Import voltooid: {result.imported} toegevoegd, {result.skipped}{" "}
                overgeslagen.
              </p>
              {result.createdCustomers ? (
                <p className="mt-1 text-emerald-300/90">
                  {result.createdCustomers} nieuwe klant
                  {result.createdCustomers === 1 ? "" : "en"} aangemaakt.
                </p>
              ) : null}
              {result.errors.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-amber-200/90">
                  {result.errors.map((err) => (
                    <li key={err}>• {err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
