"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  FileText,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createProject } from "@/app/dashboard/offertes/projecten/actions";
import { uploadProjectBestanden } from "@/app/dashboard/offertes/projecten/bestanden-actions";
import type { ProjectStatus } from "@/components/dashboard/projecten/projecten";

const fieldClass =
  "h-11 w-full rounded-lg border border-white/10 bg-zinc-900/80 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20";

const ACCEPT = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv";
const MAX_PENDING = 20;
const MAX_BYTES = 15 * 1024 * 1024;

const ALLOWED_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "gif",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "txt",
  "csv",
]);

const subscribeToClient = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function fileExt(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function isAllowedFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return ALLOWED_EXT.has(fileExt(file.name));
}

function formatPlanningLabel(start: string, end: string) {
  const fmt = (iso: string) => {
    if (!iso) return "";
    return new Intl.DateTimeFormat("nl-BE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${iso}T12:00:00`));
  };
  const s = fmt(start);
  const e = fmt(end);
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

export type NieuwProjectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
};

export function NieuwProjectModal({
  open,
  onOpenChange,
  returnFocusRef,
}: NieuwProjectModalProps) {
  const router = useRouter();
  const titleId = useId();
  const descId = useId();
  const errorId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    naam?: string;
    klant_naam?: string;
  }>({});
  const [pending, startTransition] = useTransition();
  const [uploadBusy, setUploadBusy] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    naam: "",
    klant_naam: "",
    start_datum: "",
    eind_datum: "",
    status: "gepland" as ProjectStatus,
  });
  const mounted = useSyncExternalStore(
    subscribeToClient,
    clientSnapshot,
    serverSnapshot,
  );

  const canSubmit =
    form.naam.trim().length > 0 &&
    form.klant_naam.trim().length > 0 &&
    !pending &&
    !uploadBusy;

  function reset() {
    setError(null);
    setFieldErrors({});
    setFiles([]);
    setUploadBusy(false);
    setForm({
      naam: "",
      klant_naam: "",
      start_datum: "",
      eind_datum: "",
      status: "gepland",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function close() {
    if (pending || uploadBusy) return;
    onOpenChange(false);
    reset();
    queueMicrotask(() => returnFocusRef?.current?.focus());
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (pending || uploadBusy) return;
        onOpenChange(false);
        setError(null);
        setFieldErrors({});
        setFiles([]);
        setUploadBusy(false);
        setForm({
          naam: "",
          klant_naam: "",
          start_datum: "",
          eind_datum: "",
          status: "gepland",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        queueMicrotask(() => returnFocusRef?.current?.focus());
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange, pending, uploadBusy, returnFocusRef]);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const rejected: string[] = [];
    setFiles((prev) => {
      const next = [...prev];
      for (const file of Array.from(list)) {
        if (next.length >= MAX_PENDING) {
          rejected.push(`Maximaal ${MAX_PENDING} bestanden.`);
          break;
        }
        if (file.size > MAX_BYTES) {
          rejected.push(`${file.name}: groter dan 15 MB`);
          continue;
        }
        if (!isAllowedFile(file)) {
          rejected.push(`${file.name}: type niet toegelaten`);
          continue;
        }
        const duplicate = next.some(
          (f) => f.name === file.name && f.size === file.size,
        );
        if (!duplicate) next.push(file);
      }
      return next;
    });
    if (rejected.length) setError(rejected[0] ?? null);
    else setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validate() {
    const next: { naam?: string; klant_naam?: string } = {};
    if (!form.naam.trim()) next.naam = "Projectnaam is verplicht.";
    if (!form.klant_naam.trim()) next.klant_naam = "Klant is verplicht.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit() {
    if (!validate() || pending || uploadBusy) return;
    startTransition(async () => {
      setError(null);
      const planning = formatPlanningLabel(form.start_datum, form.eind_datum);
      const result = await createProject({
        naam: form.naam,
        klant_naam: form.klant_naam,
        start_datum_label: planning || undefined,
        status: form.status,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      if (result.id && files.length > 0) {
        setUploadBusy(true);
        const fd = new FormData();
        files.forEach((f) => fd.append("bestanden", f));
        const upload = await uploadProjectBestanden({
          projectId: result.id,
          formData: fd,
        });
        setUploadBusy(false);
        if ("error" in upload && upload.error) {
          setError(
            `Project aangemaakt, maar upload mislukte: ${upload.error}`,
          );
          router.refresh();
          return;
        }
      }

      onOpenChange(false);
      reset();
      router.refresh();
      queueMicrotask(() => returnFocusRef?.current?.focus());
    });
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Sluiten"
        className="absolute inset-0 bg-black/70"
        disabled={pending || uploadBusy}
        onClick={() => {
          if (!pending && !uploadBusy) close();
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 flex max-h-[100dvh] w-full max-w-[760px] flex-col rounded-t-2xl border border-white/[0.08] bg-zinc-950 shadow-2xl sm:max-h-[calc(100vh-48px)] sm:rounded-xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-zinc-50">
              Nieuw project
            </h2>
            <p id={descId} className="mt-0.5 text-sm text-zinc-400">
              Voeg klantgegevens, planning en documenten toe.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={pending || uploadBusy}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 disabled:opacity-45"
            aria-label="Sluiten"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="np-naam" className="mb-1.5 block text-sm font-medium text-zinc-200">
                Projectnaam <span className="text-sky-400">*</span>
              </label>
              <input
                ref={firstFieldRef}
                id="np-naam"
                className={fieldClass}
                value={form.naam}
                aria-invalid={Boolean(fieldErrors.naam)}
                aria-describedby={fieldErrors.naam ? "np-naam-err" : undefined}
                onChange={(e) => {
                  setForm((f) => ({ ...f, naam: e.target.value }));
                  if (fieldErrors.naam) {
                    setFieldErrors((err) => ({ ...err, naam: undefined }));
                  }
                }}
                placeholder="bv. Renovatie Peeters"
                autoComplete="off"
              />
              {fieldErrors.naam && (
                <p id="np-naam-err" className="mt-1.5 text-xs text-rose-400" role="alert">
                  {fieldErrors.naam}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="np-klant" className="mb-1.5 block text-sm font-medium text-zinc-200">
                  Klant <span className="text-sky-400">*</span>
                </label>
                <input
                  id="np-klant"
                  className={fieldClass}
                  value={form.klant_naam}
                  aria-invalid={Boolean(fieldErrors.klant_naam)}
                  aria-describedby={
                    fieldErrors.klant_naam ? "np-klant-err" : undefined
                  }
                  onChange={(e) => {
                    setForm((f) => ({ ...f, klant_naam: e.target.value }));
                    if (fieldErrors.klant_naam) {
                      setFieldErrors((err) => ({
                        ...err,
                        klant_naam: undefined,
                      }));
                    }
                  }}
                  placeholder="bv. Renovatie Peeters BV"
                  autoComplete="organization"
                />
                {fieldErrors.klant_naam && (
                  <p
                    id="np-klant-err"
                    className="mt-1.5 text-xs text-rose-400"
                    role="alert"
                  >
                    {fieldErrors.klant_naam}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="np-status" className="mb-1.5 block text-sm font-medium text-zinc-200">
                  Status
                </label>
                <select
                  id="np-status"
                  className={fieldClass}
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as ProjectStatus,
                    }))
                  }
                >
                  <option value="gepland">Gepland</option>
                  <option value="actief">Actief</option>
                  <option value="gepauzeerd">Gepauzeerd</option>
                  <option value="afgerond">Afgerond</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="np-start" className="mb-1.5 block text-sm font-medium text-zinc-200">
                  Startdatum
                </label>
                <input
                  id="np-start"
                  type="date"
                  className={fieldClass}
                  value={form.start_datum}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start_datum: e.target.value }))
                  }
                />
              </div>
              <div>
                <label htmlFor="np-eind" className="mb-1.5 block text-sm font-medium text-zinc-200">
                  Einddatum
                </label>
                <input
                  id="np-eind"
                  type="date"
                  className={fieldClass}
                  value={form.eind_datum}
                  min={form.start_datum || undefined}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, eind_datum: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-200">
                Documenten en foto&apos;s
              </label>
              <label
                className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-zinc-900/60 px-4 py-5 text-center transition-colors hover:border-sky-500/40 hover:bg-sky-500/[0.06]"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addFiles(e.dataTransfer.files);
                }}
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
                  <Upload size={18} />
                </span>
                <span className="text-sm font-medium text-zinc-200">
                  Sleep bestanden hierheen of klik om te kiezen
                </span>
                <span className="max-w-sm text-[11px] leading-relaxed text-zinc-500">
                  Foto&apos;s (JPEG, PNG, WebP, HEIC), PDF en Office (.doc,
                  .docx, .xls, .xlsx, .txt, .csv) — max. 15 MB per bestand, max.{" "}
                  {MAX_PENDING} tegelijk
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                  disabled={pending || uploadBusy}
                />
              </label>

              {files.length > 0 && (
                <ul className="mt-2 divide-y divide-white/[0.06] rounded-lg border border-white/[0.08]">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sky-500/10 text-sky-400">
                        {isImageFile(file) ? (
                          <ImageIcon size={14} />
                        ) : (
                          <FileText size={14} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-zinc-100">{file.name}</p>
                        <p className="text-[11px] text-zinc-500">
                          {isImageFile(file) ? "Foto" : "Document"} ·{" "}
                          {formatBytes(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, i) => i !== index))
                        }
                        disabled={pending || uploadBusy}
                        className="grid h-11 w-11 place-items-center rounded-lg text-zinc-500 hover:bg-white/[0.06] hover:text-rose-300 disabled:opacity-45"
                        aria-label={`${file.name} verwijderen`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <p
                id={errorId}
                className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/[0.08] bg-zinc-950 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            disabled={pending || uploadBusy}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.08] disabled:opacity-45"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {(pending || uploadBusy) && (
              <Loader2 size={16} className="animate-spin" />
            )}
            {pending || uploadBusy
              ? "Project wordt aangemaakt…"
              : "Project aanmaken"}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export default function NieuwProjectButton({
  label = "Nieuw project",
  className,
  fullWidth,
}: {
  label?: string;
  className?: string;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          `inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400 ${
            fullWidth ? "w-full" : ""
          }`
        }
      >
        <Plus size={16} />
        {label}
      </button>
      <NieuwProjectModal
        open={open}
        onOpenChange={setOpen}
        returnFocusRef={triggerRef}
      />
    </>
  );
}
