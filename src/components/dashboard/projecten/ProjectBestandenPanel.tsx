"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  FileText,
  ImageIcon,
  Loader2,
  Trash2,
  Upload,
  File,
  Map,
  ScrollText,
} from "lucide-react";
import {
  deleteProjectBestand,
  uploadProjectBestanden,
  type ProjectBestandCategory,
  type ProjectBestandRow,
} from "@/app/dashboard/offertes/projecten/bestanden-actions";

const CATEGORY_META: Record<
  ProjectBestandCategory,
  { label: string; icon: typeof File }
> = {
  foto: { label: "Foto", icon: ImageIcon },
  offerte_foto: { label: "Offertefoto", icon: ImageIcon },
  document: { label: "Document", icon: FileText },
  plan: { label: "Plan", icon: Map },
  contract: { label: "Contract", icon: ScrollText },
  andere: { label: "Andere", icon: File },
};

function isImage(mime: string | null | undefined) {
  return !!mime && mime.startsWith("image/");
}

function formatBytes(n: number | null | undefined) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function safeUploadError(message: string) {
  const expectedMessages = [
    "Selecteer minstens één bestand.",
    "Maximaal ",
    " is groter dan 15 MB.",
    ": dit bestandstype is niet toegelaten",
  ];
  return expectedMessages.some((part) => message.includes(part))
    ? message
    : "Uploaden mislukt. Controleer het bestand en probeer opnieuw.";
}

export default function ProjectBestandenPanel({
  projectId,
  customerId,
  offerteId,
  initialBestanden,
  initialError,
  readOnly,
}: {
  projectId: string;
  customerId?: number | null;
  offerteId?: number | null;
  initialBestanden: ProjectBestandRow[];
  initialError?: string | null;
  readOnly?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [bestanden, setBestanden] = useState(initialBestanden);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, startTransition] = useTransition();

  const fotos = bestanden.filter(
    (b) =>
      b.category === "foto" ||
      b.category === "offerte_foto" ||
      isImage(b.mime_type),
  );
  const docs = bestanden.filter(
    (b) =>
      b.category !== "foto" &&
      b.category !== "offerte_foto" &&
      !isImage(b.mime_type),
  );

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("bestanden", f));
    setError(null);
    startTransition(async () => {
      const result = await uploadProjectBestanden({
        projectId,
        customerId,
        offerteId,
        formData: fd,
      });
      if ("error" in result && result.error) {
        setError(safeUploadError(result.error));
        return;
      }
      // Refresh via soft reload of list
      const { listProjectBestanden } = await import(
        "@/app/dashboard/offertes/projecten/bestanden-actions"
      );
      const listed = await listProjectBestanden(projectId);
      if (listed.bestanden) setBestanden(listed.bestanden);
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(id: string) {
    if (!confirm("Dit bestand verwijderen?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProjectBestand(id);
      if ("error" in result && result.error) {
        setError("Verwijderen mislukt. Probeer het opnieuw.");
        return;
      }
      setBestanden((prev) => prev.filter((b) => b.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Bestanden & foto&apos;s
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Per klant/project — foto&apos;s van de offerte worden hier automatisch
            bijgevoegd.
          </p>
        </div>
        {!readOnly && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Upload size={13} />
              )}
              Uploaden
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              className="hidden"
              onChange={onPick}
              disabled={pending}
              aria-label="Projectbestanden kiezen"
            />
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}

      {fotos.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Foto&apos;s ({fotos.length})
          </p>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
            {fotos.map((f) => (
              <div
                key={f.id}
                className="group relative aspect-square overflow-hidden rounded-md border border-white/10 bg-zinc-900"
              >
                {f.url ? (
                  <a href={f.url} target="_blank" rel="noreferrer">
                    <Image
                      src={f.url}
                      alt={f.original_name}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="64px"
                    />
                  </a>
                ) : (
                  <span className="grid h-full place-items-center text-zinc-600">
                    <ImageIcon size={14} />
                  </span>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    disabled={pending}
                    className="absolute right-0.5 top-0.5 grid h-7 w-7 place-items-center rounded bg-black/70 text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:text-rose-300 focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`${f.original_name} verwijderen`}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[8px] text-zinc-300 opacity-0 transition group-hover:opacity-100">
                  {f.original_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {docs.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Documenten ({docs.length})
          </p>
          <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
            {docs.map((d) => {
              const meta = CATEGORY_META[d.category] ?? CATEGORY_META.document;
              const Icon = meta.icon;
              return (
                <li
                  key={d.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-violet-500/10 text-violet-400">
                    <Icon size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    {d.url ? (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-zinc-200 hover:text-sky-300"
                      >
                        {d.original_name}
                      </a>
                    ) : (
                      <span className="block truncate text-zinc-200">
                        {d.original_name}
                      </span>
                    )}
                    <p className="text-[10px] text-zinc-500">
                      {meta.label}
                      {d.size_bytes ? ` · ${formatBytes(d.size_bytes)}` : ""}
                    </p>
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => remove(d.id)}
                      disabled={pending}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`${d.original_name} verwijderen`}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {bestanden.length === 0 && !error && (
        <div className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center">
          <span className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-400">
            <Upload size={16} />
          </span>
          <p className="text-sm text-zinc-300">Nog geen bestanden</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Upload plannen, contracten of werffoto&apos;s — of keur een offerte goed
            met foto&apos;s.
          </p>
        </div>
      )}
    </div>
  );
}
