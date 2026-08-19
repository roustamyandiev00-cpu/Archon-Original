"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import { lookupBelgianCompany } from "@/app/dashboard/contacten/lookup-actions";
import {
  shouldLookupCompany,
  type CompanyLookupResult,
} from "@/components/dashboard/contacten/companyLookup";

const inputCls =
  "w-full rounded-xl border border-white/[0.08] bg-zinc-950/70 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow] focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/15";

type LookupUi =
  | { kind: "idle" }
  | { kind: "loading"; key: string }
  | { kind: "found"; key: string; name: string }
  | { kind: "error"; key: string; message: string };

function digitsKey(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * BTW-waarde blijft controlled via props.
 * Lookup-UI (loading/found/error) is lokale feedback, zichtbaar alleen als key
 * overeenkomt met de huidige value — zo geen setState-sync in effects nodig.
 */
function useBtwLookup(value: string, onResolved: (data: CompanyLookupResult) => void) {
  const [ui, setUi] = useState<LookupUi>({ kind: "idle" });
  const requestGenRef = useRef(0);
  const lastSuccessKeyRef = useRef("");
  const onResolvedRef = useRef(onResolved);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onResolvedRef.current = onResolved;
  }, [onResolved]);

  const key = digitsKey(value);

  const loading = ui.kind === "loading" && ui.key === key;
  const foundName = ui.kind === "found" && ui.key === key ? ui.name : null;
  const error = ui.kind === "error" && ui.key === key ? ui.message : null;

  function cancelScheduledLookup() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }

  /** Annuleer debounce en maak in-flight resultaten ongeldig — zonder setState. */
  function invalidatePendingLookups() {
    cancelScheduledLookup();
    requestGenRef.current += 1;
  }

  useEffect(() => {
    const gen = ++requestGenRef.current;

    if (!shouldLookupCompany(value)) {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        requestGenRef.current += 1;
      };
    }

    const handle = setTimeout(() => {
      void (async () => {
        if (key === lastSuccessKeyRef.current) return;
        if (gen !== requestGenRef.current) return;

        setUi({ kind: "loading", key });
        const result = await lookupBelgianCompany(value);
        if (gen !== requestGenRef.current) return;

        if ("error" in result) {
          setUi({ kind: "error", key, message: result.error });
          return;
        }

        lastSuccessKeyRef.current = key;
        setUi({ kind: "found", key, name: result.data.name });
        onResolvedRef.current(result.data);
      })();
    }, 700);

    debounceRef.current = handle;

    return () => {
      clearTimeout(handle);
      if (debounceRef.current === handle) debounceRef.current = null;
      // Unmount of value-change: geplande debounce weg + lopende resultaten ongeldig.
      requestGenRef.current += 1;
    };
  }, [value, key]);

  async function lookupNow() {
    // Voorkom dat de geplande auto-lookup nog vertrekt; invalideer in-flight auto.
    invalidatePendingLookups();
    const gen = requestGenRef.current;

    if (!shouldLookupCompany(value)) {
      setUi({
        kind: "error",
        key,
        message: "Vul een volledig Belgisch BTW- of KBO-nummer in.",
      });
      return;
    }

    setUi({ kind: "loading", key });
    const result = await lookupBelgianCompany(value);
    if (gen !== requestGenRef.current) return;

    if ("error" in result) {
      setUi({ kind: "error", key, message: result.error });
      return;
    }

    lastSuccessKeyRef.current = key;
    setUi({ kind: "found", key, name: result.data.name });
    onResolvedRef.current(result.data);
  }

  function resetUiFeedback() {
    // Typen: annuleer geplande debounce + stale in-flight vóór parent-onChange.
    invalidatePendingLookups();
    setUi({ kind: "idle" });
  }

  return {
    loading,
    foundName,
    error,
    lookupNow,
    resetUiFeedback,
  };
}

export function BtwLookupField({
  value,
  onChange,
  onResolved,
  label = "BTW-nummer",
  hint = "bv. BE0123456789 — gegevens worden automatisch ingevuld",
  accent = "orange",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onResolved: (data: CompanyLookupResult) => void;
  label?: string;
  hint?: string;
  accent?: "orange" | "sky";
  className?: string;
}) {
  const { loading, foundName, error, lookupNow, resetUiFeedback } = useBtwLookup(
    value,
    onResolved,
  );

  const focusRing =
    accent === "sky"
      ? "focus:border-sky-500/60 focus:ring-sky-500/15"
      : "focus:border-orange-500/50 focus:ring-orange-500/15";

  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">
        {label}
        <span className="text-orange-400"> *</span>
      </span>
      <div className="relative">
        <input
          required
          name="btw"
          value={value}
          onChange={(e) => {
            resetUiFeedback();
            onChange(e.target.value);
          }}
          placeholder="BE0123456789"
          className={`${inputCls} pr-10 ${focusRing}`}
        />
        <button
          type="button"
          onClick={() => void lookupNow()}
          disabled={loading}
          aria-label="Bedrijf opzoeken"
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Search size={14} />
          )}
        </button>
      </div>
      {hint && (
        <span className="mt-1 block text-[11px] text-zinc-600">{hint}</span>
      )}
      {foundName && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-400">
          <CheckCircle2 size={12} />
          Gevonden: {foundName}
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-[11px] text-amber-400">{error}</p>
      )}
    </label>
  );
}

export function BtwLookupFieldSky({
  value,
  onChange,
  onResolved,
  label,
  hint,
}: {
  value: string;
  onChange: (value: string) => void;
  onResolved: (data: CompanyLookupResult) => void;
  label?: string;
  hint?: string;
}) {
  const { loading, foundName, error, resetUiFeedback } = useBtwLookup(
    value,
    onResolved,
  );

  const skyInputCls =
    "w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-sky-500/60";

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-400">
        {label ?? "BTW-nummer"}
      </span>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => {
            resetUiFeedback();
            onChange(e.target.value);
          }}
          placeholder="BE0123456789"
          className={skyInputCls}
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-sky-400"
          />
        )}
      </div>
      {hint && (
        <span className="mt-1 block text-[11px] text-zinc-600">{hint}</span>
      )}
      {foundName && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
          <CheckCircle2 size={12} /> {foundName}
        </p>
      )}
      {error && <p className="mt-1 text-[11px] text-amber-400">{error}</p>}
    </label>
  );
}
