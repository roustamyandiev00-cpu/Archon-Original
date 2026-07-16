"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Bot,
  Check,
  Download,
  FileSignature,
  Loader2,
  PenLine,
  Send,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  generateSamenwerkingContract,
  sendContractForSigning,
  signSamenwerkingContract,
  voidSamenwerkingContract,
} from "@/app/dashboard/werkposts/samenwerkingen/contract-actions";
import type { SamenwerkingContractRow } from "@/lib/werkposts/contracts";
import { checkContractCompleteness } from "@/lib/werkposts/contract-completeness";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-sky-500/60";

function statusLabel(status: SamenwerkingContractRow["status"]) {
  switch (status) {
    case "draft":
      return "Concept";
    case "pending_signatures":
      return "Wacht op handtekeningen";
    case "signed":
      return "Getekend";
    default:
      return status;
  }
}

function statusTone(status: SamenwerkingContractRow["status"]) {
  switch (status) {
    case "draft":
      return "bg-zinc-800 text-zinc-300";
    case "pending_signatures":
      return "bg-amber-500/15 text-amber-300";
    case "signed":
      return "bg-emerald-500/15 text-emerald-300";
    default:
      return "bg-zinc-800 text-zinc-400";
  }
}

export default function SamenwerkingContractPanel({
  channelId,
  companyId,
  partyAName,
  partyBName,
  initialContract,
  onContractChange,
  compact = false,
}: {
  channelId: string;
  companyId: number;
  partyAName: string;
  partyBName: string;
  initialContract: SamenwerkingContractRow | null;
  onContractChange?: (contract: SamenwerkingContractRow | null) => void;
  compact?: boolean;
}) {
  const [contract, setContract] = useState(initialContract);
  const [extraPrompt, setExtraPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setContract(initialContract);
  }, [initialContract, channelId]);

  const isPartyA = companyId === contract?.partyACompanyId;
  const isPartyB = companyId === contract?.partyBCompanyId;
  const mySigned = isPartyA
    ? Boolean(contract?.partyASignedAt)
    : isPartyB
      ? Boolean(contract?.partyBSignedAt)
      : false;
  const otherSigned = isPartyA
    ? Boolean(contract?.partyBSignedAt)
    : isPartyB
      ? Boolean(contract?.partyASignedAt)
      : false;

  const completeness = contract?.draftJson
    ? checkContractCompleteness(contract.draftJson)
    : null;

  function updateContract(next: SamenwerkingContractRow | null) {
    setContract(next);
    onContractChange?.(next);
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const res = await generateSamenwerkingContract(channelId, extraPrompt);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.contract) updateContract(res.contract);
    });
  }

  function handleSend() {
    if (!contract) return;
    setError(null);
    startTransition(async () => {
      const res = await sendContractForSigning(contract.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      updateContract({ ...contract, status: "pending_signatures" });
    });
  }

  function handleSign() {
    if (!contract) return;
    setError(null);
    startTransition(async () => {
      const res = await signSamenwerkingContract(contract.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.contract) updateContract(res.contract);
    });
  }

  function handleVoid() {
    if (!contract) return;
    setError(null);
    startTransition(async () => {
      const res = await voidSamenwerkingContract(contract.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      updateContract(null);
    });
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileSignature size={16} className="text-sky-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Samenwerkingsovereenkomst
            </h3>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            AI stelt een contract op; beide partijen tekenen digitaal.
          </p>
        </div>
        {contract && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusTone(contract.status)}`}
          >
            {statusLabel(contract.status)}
          </span>
        )}
      </div>

      {!contract ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <label className="block text-xs font-medium text-zinc-400">
            Extra instructies voor de AI (optioneel)
          </label>
          <textarea
            value={extraPrompt}
            onChange={(e) => setExtraPrompt(e.target.value)}
            rows={3}
            placeholder="Bv. vaste prijs €12.000, betaling 50/50, aansprakelijkheid beperkt tot €5.000…"
            className={inputClass}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={handleGenerate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Contract genereren…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Genereer contract met AI
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-white/10 bg-zinc-950/40">
            <div className="border-b border-white/5 px-4 py-2.5">
              <p className="text-sm font-medium text-zinc-100">{contract.titel}</p>
              <p className="text-[11px] text-zinc-500">
                {partyAName} ↔ {partyBName}
              </p>
            </div>
            <iframe
              title="Contract preview"
              srcDoc={contract.draftHtml}
              className="h-[min(420px,50vh)] w-full bg-white"
              sandbox=""
            />
          </div>

          {completeness && !completeness.ok && contract.status !== "signed" && (
            <div className="flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
              <TriangleAlert size={14} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Contract lijkt onvolledig (waarschuwing)</p>
                <p className="mt-0.5 text-amber-200/80">
                  Mogelijk ontbreken: {completeness.missing.join(", ")}. Dit
                  blokkeert ondertekening niet.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div
              className={`rounded-lg border px-3 py-2 ${
                contract.partyASignedAt
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-white/10 bg-zinc-900/40"
              }`}
            >
              <p className="font-medium text-zinc-300">{partyAName}</p>
              <p className="mt-1 text-zinc-500">
                {contract.partyASignedAt ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <Check size={12} /> {contract.partyASignerName}
                  </span>
                ) : (
                  "Nog niet getekend"
                )}
              </p>
            </div>
            <div
              className={`rounded-lg border px-3 py-2 ${
                contract.partyBSignedAt
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-white/10 bg-zinc-900/40"
              }`}
            >
              <p className="font-medium text-zinc-300">{partyBName}</p>
              <p className="mt-1 text-zinc-500">
                {contract.partyBSignedAt ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <Check size={12} /> {contract.partyBSignerName}
                  </span>
                ) : (
                  "Nog niet getekend"
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {contract.status === "draft" && (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5"
                >
                  <Bot size={14} />
                  Opnieuw genereren
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSend}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-sky-400"
                >
                  <Send size={14} />
                  Verstuur ter ondertekening
                </button>
              </>
            )}

            {contract.status === "pending_signatures" && !mySigned && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleSign}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
              >
                <PenLine size={14} />
                Ondertekenen
              </button>
            )}

            {contract.status === "pending_signatures" && mySigned && !otherSigned && (
              <p className="flex items-center gap-1.5 text-xs text-amber-300">
                <Check size={14} />
                Jij hebt getekend — wacht op de andere partij.
              </p>
            )}

            {contract.status === "signed" && (
              <a
                href={`/dashboard/werkposts/samenwerkingen/contract/${contract.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
              >
                <Download size={14} />
                Download PDF
              </a>
            )}

            {contract.status !== "signed" && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleVoid}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/10"
              >
                <X size={14} />
                Annuleren
              </button>
            )}
          </div>
        </>
      )}

      {error && (
        <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
