"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Download, Loader2, Radio, AlertTriangle } from "lucide-react";
import {
  checkFactuurPeppolReadiness,
  sendFactuurViaPeppol,
  updateFactuurPeppolFields,
} from "@/app/dashboard/facturen/peppolActions";
import type { PeppolValidationIssue } from "@/lib/peppol/validate";

export default function PeppolActions({
  factuurId,
  peppolConnected,
  peppolCanSend = false,
  buyerReference,
  structuredCommunication,
  peppolStatus,
  peppolLastError,
}: {
  factuurId: number;
  peppolConnected: boolean;
  peppolCanSend?: boolean;
  buyerReference?: string | null;
  structuredCommunication?: string | null;
  peppolStatus?: string | null;
  peppolLastError?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [saving, startSave] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [issues, setIssues] = useState<PeppolValidationIssue[]>([]);
  const [buyerRef, setBuyerRef] = useState(buyerReference ?? "");
  const [structured, setStructured] = useState(structuredCommunication ?? "");

  useEffect(() => {
    startTransition(async () => {
      const res = await checkFactuurPeppolReadiness(factuurId);
      if (res && "issues" in res && res.issues) {
        setIssues(res.issues);
      }
    });
  }, [factuurId, buyerRef, structured]);

  function saveFields() {
    setMsg(null);
    startSave(async () => {
      const res = await updateFactuurPeppolFields(factuurId, {
        buyerReference: buyerRef,
        structuredCommunication: structured,
      });
      if (res && "error" in res && res.error) {
        setMsg({ ok: false, text: res.error });
        return;
      }
      setMsg({ ok: true, text: "Peppol-velden opgeslagen." });
    });
  }

  function send() {
    setMsg(null);
    startTransition(async () => {
      const res = await sendFactuurViaPeppol(factuurId);
      if (res && "error" in res && res.error) {
        setMsg({ ok: false, text: res.error });
        if ("issues" in res && Array.isArray(res.issues)) {
          setIssues(res.issues as PeppolValidationIssue[]);
        }
        return;
      }
      setMsg({ ok: true, text: "Verstuurd via Peppol." });
      setIssues([]);
    });
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
        <Radio size={15} className="text-sky-400" />
        Peppol e-facturatie
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500">
        Conform Peppol BIS Billing 3.0 (EN16931) — verplicht voor B2B in België
        sinds 2026.
      </p>

      {peppolStatus === "verzonden" && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          <Check size={13} /> Reeds verzonden via Peppol
        </p>
      )}

      {peppolLastError && peppolStatus === "fout" && (
        <p className="mt-3 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {peppolLastError}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Kopersreferentie (BT-10) *
          </label>
          <input
            value={buyerRef}
            onChange={(e) => setBuyerRef(e.target.value)}
            placeholder="Orderref / PO-nummer koper"
            className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Gestructureerde mededeling
          </label>
          <input
            value={structured}
            onChange={(e) => setStructured(e.target.value)}
            placeholder="+++000/0000/00000+++"
            className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500/50"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={saveFields}
        disabled={saving}
        className="mt-3 text-xs font-medium text-sky-400 hover:text-sky-300 disabled:opacity-60"
      >
        {saving ? "Opslaan…" : "Peppol-velden opslaan"}
      </button>

      {(errors.length > 0 || warnings.length > 0) && (
        <div className="mt-4 space-y-2 rounded-lg border border-white/8 bg-zinc-950/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Peppol-checklist
          </p>
          {errors.map((issue) => (
            <p
              key={`${issue.field}-${issue.message}`}
              className="flex items-start gap-2 text-xs text-rose-300"
            >
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              {issue.message}
            </p>
          ))}
          {warnings.map((issue) => (
            <p
              key={`${issue.field}-${issue.message}`}
              className="flex items-start gap-2 text-xs text-amber-300/90"
            >
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              {issue.message}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={`/dashboard/facturen/${factuurId}/peppol`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
        >
          <Download size={15} /> Download UBL (e-factuur)
        </a>
        <button
          type="button"
          onClick={send}
          disabled={pending || errors.length > 0 || !peppolCanSend}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Versturen…
            </>
          ) : (
            <>
              <Radio size={15} /> Verstuur via Peppol
            </>
          )}
        </button>
      </div>

      {!peppolConnected && (
        <p className="mt-3 text-xs text-amber-300/90">
          Peppol is nog niet verbonden. De UBL-download werkt altijd; voor
          rechtstreeks versturen koppel je eerst een access point via{" "}
          <a href="/dashboard/integraties" className="underline hover:text-amber-200">
            Integraties
          </a>
          .
        </p>
      )}

      {peppolConnected && !peppolCanSend && (
        <p className="mt-3 text-xs text-amber-300/90">
          Peppol is gekoppeld maar automatisch versturen is niet actief. Kies
          Storecove of Billit als access point en vul je API-sleutel in via{" "}
          <a href="/dashboard/integraties" className="underline hover:text-amber-200">
            Integraties
          </a>
          , of download de UBL-XML hierboven.
        </p>
      )}

      {msg && (
        <p
          className={`mt-3 inline-flex items-center gap-1.5 text-xs ${
            msg.ok ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {msg.ok && <Check size={13} />} {msg.text}
        </p>
      )}
    </div>
  );
}
