"use client";

import { useState } from "react";
import {
  BILLIT_FEATURE_MATRIX,
  archonStatusLabel,
  billitLicenseLabel,
  type ArchonFeatureStatus,
} from "@/lib/finance/billit-feature-matrix";

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "warn" | "neutral" | "orange" | "muted";
}) {
  const cls =
    tone === "ok"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
      : tone === "warn"
        ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
        : tone === "orange"
          ? "bg-orange-500/10 text-orange-300 border-orange-500/20"
          : tone === "muted"
            ? "bg-zinc-800 text-zinc-500 border-white/[0.06]"
            : "bg-white/[0.04] text-zinc-400 border-white/[0.08]";

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

function archonTone(status: ArchonFeatureStatus) {
  if (status === "live") return "ok" as const;
  if (status === "partial") return "orange" as const;
  if (status === "planned") return "warn" as const;
  return "muted" as const;
}

function billitTone(license: string) {
  return license === "yes" || license === "free" ? "ok" : license === "paid" ? "orange" : "muted";
}

export default function BillitFeatureMatrix() {
  const [open, setOpen] = useState<string | null>("e-invoicing");

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/60">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          ArchonPro vs Billit — featurematrix
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Gebaseerd op het officiële{" "}
          <a
            href="https://www.billit.eu/nl-be/functies/alle-features/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300"
          >
            Billit featureoverzicht
          </a>
          . Toont waar ArchonPro al gelijk staat en wat nog volgt.
        </p>
      </div>

      <div className="divide-y divide-white/[0.05]">
        {BILLIT_FEATURE_MATRIX.map((category) => {
          const isOpen = open === category.id;
          const liveCount = category.features.filter((f) => f.archon === "live").length;
          return (
            <div key={category.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : category.id)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
              >
                <span className="text-sm font-medium text-zinc-200">
                  {category.title}
                </span>
                <span className="text-xs text-zinc-500">
                  {liveCount}/{category.features.length} live
                </span>
              </button>
              {isOpen && (
                <div className="overflow-x-auto px-5 pb-4">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                        <th className="pb-2 pr-4 font-semibold">Feature</th>
                        <th className="pb-2 pr-3 font-semibold">Billit gratis</th>
                        <th className="pb-2 pr-3 font-semibold">Billit betaald</th>
                        <th className="pb-2 font-semibold">ArchonPro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {category.features.map((row) => (
                        <tr key={row.name} className="align-top">
                          <td className="py-2.5 pr-4 text-zinc-300">
                            {row.name}
                            {row.archonNote && (
                              <p className="mt-0.5 text-[10px] text-zinc-600">
                                {row.archonNote}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 pr-3">
                            <StatusBadge
                              label={billitLicenseLabel(row.billitFree)}
                              tone={billitTone(row.billitFree)}
                            />
                          </td>
                          <td className="py-2.5 pr-3">
                            <StatusBadge
                              label={billitLicenseLabel(row.billitPaid)}
                              tone={billitTone(row.billitPaid)}
                            />
                          </td>
                          <td className="py-2.5">
                            <StatusBadge
                              label={archonStatusLabel(row.archon)}
                              tone={archonTone(row.archon)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
