"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import { createProject } from "@/app/dashboard/offertes/projecten/actions";
import type { ProjectStatus } from "@/components/dashboard/projecten/projecten";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500/60";

export default function NieuwProjectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    naam: "",
    klant_naam: "",
    start_datum_label: "",
    status: "gepland" as ProjectStatus,
  });

  function close() {
    setOpen(false);
    setError(null);
    setForm({
      naam: "",
      klant_naam: "",
      start_datum_label: "",
      status: "gepland",
    });
  }

  function submit() {
    startTransition(async () => {
      setError(null);
      const result = await createProject(form);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      close();
      if (result.id) {
        router.push(`/dashboard/offertes/projecten/${result.id}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400"
      >
        <Plus size={16} />
        Nieuw project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100">
                Nieuw project
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-200">
                  Projectnaam
                </label>
                <input
                  className={inputClass}
                  value={form.naam}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, naam: e.target.value }))
                  }
                  placeholder="bv. Renovatie Peeters"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-200">
                  Klant
                </label>
                <input
                  className={inputClass}
                  value={form.klant_naam}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, klant_naam: e.target.value }))
                  }
                  placeholder="bv. Renovatie Peeters BV"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-200">
                    Start (label)
                  </label>
                  <input
                    className={inputClass}
                    value={form.start_datum_label}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        start_datum_label: e.target.value,
                      }))
                    }
                    placeholder="bv. Mrt 2026"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-200">
                    Status
                  </label>
                  <select
                    className={inputClass}
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
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-50"
              >
                {pending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Aanmaken
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
