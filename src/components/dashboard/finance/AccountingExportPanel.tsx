"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Loader2, Upload } from "lucide-react";
import { formatEuro, formatDate } from "@/lib/offertes";
import {
  exportFactuurToAccountingAction,
  exportOpenFacturenAction,
} from "@/app/dashboard/e-facturen/actions";
import { StatusPill } from "@/components/dashboard/finance/FinanceHub";
import type { AccountingProvider } from "@/lib/accounting/router";

type ExportFactuur = {
  id: number;
  nummer: string | null;
  klant: string | null;
  totaal_bedrag: number | null;
  datum: string | null;
  status: string | null;
  accounting_export_id: string | null;
  accounting_exported_at: string | null;
  accounting_export_provider: string | null;
};

const PROVIDER_LABELS: Record<AccountingProvider, string> = {
  billit: "Billit",
  "exact-online": "Exact Online",
  yuki: "Yuki",
};

export default function AccountingExportPanel({
  facturen,
  providers,
}: {
  facturen: ExportFactuur[];
  providers: AccountingProvider[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<AccountingProvider>(
    providers[0] ?? "billit",
  );

  const connected = providers.length > 0;
  const teExporteren = facturen.filter((f) => !f.accounting_export_id);
  const geexporteerd = facturen.filter((f) => f.accounting_export_id);

  function runBatchExport() {
    if (!provider) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await exportOpenFacturenAction(provider);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setMessage(res.message ?? "Export voltooid.");
      if (res.failed?.length) {
        setError(
          `${res.failed.length} mislukt: ${res.failed[0]?.error ?? "onbekende fout"}`,
        );
      }
      router.refresh();
    });
  }

  function runSingleExport(id: number) {
    if (!provider) return;
    setExportingId(id);
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await exportFactuurToAccountingAction(id, provider);
      setExportingId(null);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setMessage(
        `Factuur geëxporteerd naar ${PROVIDER_LABELS[provider]} (${res.exportId}).`,
      );
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Export naar boekhouder
          </h2>
          <p className="text-xs text-zinc-500">
            Billit, Yuki (UBL) of Exact Online (sales entry)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {connected && (
            <select
              value={provider}
              onChange={(e) =>
                setProvider(e.target.value as AccountingProvider)
              }
              className="rounded-full border border-white/[0.1] bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 outline-none"
            >
              {providers.map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={runBatchExport}
            disabled={!connected || pending || teExporteren.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-orange-400 disabled:opacity-50"
          >
            {pending && exportingId === null ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Upload size={13} />
            )}
            Alles ({teExporteren.length})
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {!connected && (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-sm text-amber-200/90">
            Koppel een boekhoudprovider via{" "}
            <Link
              href="/dashboard/instellingen?tab=integraties"
              className="font-medium text-orange-300 hover:text-orange-200"
            >
              Integraties
            </Link>{" "}
            (Billit, Yuki of Exact Online).
          </p>
        )}

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

        {teExporteren.length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Te exporteren
            </p>
            <ul className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.06]">
              {teExporteren.slice(0, 10).map((f) => (
                <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {f.nummer ?? `Factuur #${f.id}`}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {[f.klant, f.datum ? formatDate(f.datum) : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-zinc-200">
                    {formatEuro(f.totaal_bedrag ?? 0)}
                  </p>
                  <button
                    type="button"
                    onClick={() => runSingleExport(f.id)}
                    disabled={!connected || pending}
                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-orange-500/25 hover:text-orange-200 disabled:opacity-50"
                  >
                    {exportingId === f.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Upload size={12} />
                    )}
                    Export
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Alle recente facturen zijn al geëxporteerd of er zijn geen
            verzonden facturen.
          </p>
        )}

        {geexporteerd.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Geëxporteerd
            </p>
            <ul className="divide-y divide-white/[0.05]">
              {geexporteerd.slice(0, 5).map((f) => (
                <li key={f.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-300">
                      {f.nummer ?? `#${f.id}`}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {f.accounting_export_provider ?? "boekhouder"}{" "}
                      {f.accounting_export_id}
                    </p>
                  </div>
                  <StatusPill label="Geëxporteerd" tone="ok" />
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link
          href="/dashboard/facturen"
          className="inline-flex items-center gap-1 text-xs font-medium text-orange-400 hover:text-orange-300"
        >
          Alle facturen bekijken
          <ArrowRight size={12} />
        </Link>
      </div>
    </section>
  );
}
