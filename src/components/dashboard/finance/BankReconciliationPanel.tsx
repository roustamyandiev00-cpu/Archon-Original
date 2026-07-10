"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Check, Loader2, Upload, Wallet } from "lucide-react";
import { formatEuro, formatDate } from "@/lib/offertes";
import {
  importBankStatementAction,
  matchBankPaymentsAction,
} from "@/app/dashboard/boekhouding/bank-actions";
import { StatusPill } from "@/components/dashboard/finance/FinanceHub";

type BankAccount = {
  id: number;
  iban: string;
  alias: string | null;
};

type BankTransaction = {
  id: number;
  transactie_datum: string;
  bedrag: number;
  tegenpartij: string | null;
  omschrijving: string | null;
  gestructureerde_mededeling: string | null;
  match_status: string;
  factuur_id: number | null;
};

export default function BankReconciliationPanel({
  accounts,
  transactions,
  openCount,
  matchedCount,
}: {
  accounts: BankAccount[];
  transactions: BankTransaction[];
  openCount: number;
  matchedCount: number;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [iban, setIban] = useState(accounts[0]?.iban ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function runImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Kies een CSV- of CAMT-bestand.");
      return;
    }
    setError(null);
    setMessage(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("iban", iban);
    startTransition(async () => {
      const res = await importBankStatementAction(fd);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setMessage(res.message ?? "Import voltooid.");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  function runMatch() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await matchBankPaymentsAction();
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setMessage(res.message ?? "Matching voltooid.");
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <Wallet size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Bank & betalingscontrole</h2>
            <p className="text-xs text-zinc-500">
              Importeer afschriften (CSV/CAMT) en match met facturen
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={runMatch}
          disabled={pending || openCount === 0}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Check size={13} />
          )}
          Auto-match ({openCount})
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder="BE68 5390 0754 7034"
            className="rounded-xl border border-white/[0.08] bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-orange-500/30"
          />
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xml,.txt"
              className="max-w-[180px] text-xs text-zinc-400 file:mr-2 file:rounded-full file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:text-zinc-200"
            />
            <button
              type="button"
              onClick={runImport}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-orange-400 disabled:opacity-50"
            >
              <Upload size={13} />
              Import
            </button>
          </div>
        </div>

        <div className="flex gap-4 text-xs text-zinc-500">
          <span>{matchedCount} gematcht</span>
          <span>{openCount} open</span>
          <span>{accounts.length} rekening{accounts.length === 1 ? "" : "en"}</span>
        </div>

        {message && (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-sm text-emerald-300">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-rose-500/20 bg-rose-500/[0.05] px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        )}

        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Upload een bankexport van Belfius, KBC, ING of andere Belgische banken.
            Open banking (Isabel/Ponto) volgt in een volgende fase.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.06]">
            {transactions.slice(0, 12).map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-200">
                    {tx.tegenpartij ?? tx.omschrijving ?? "Transactie"}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {[
                      formatDate(tx.transactie_datum),
                      tx.gestructureerde_mededeling,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <p
                  className={`text-sm font-medium tabular-nums ${
                    tx.bedrag >= 0 ? "text-emerald-300" : "text-zinc-400"
                  }`}
                >
                  {formatEuro(tx.bedrag)}
                </p>
                <StatusPill
                  label={tx.match_status === "gematcht" ? "Gematcht" : "Open"}
                  tone={tx.match_status === "gematcht" ? "ok" : "neutral"}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
