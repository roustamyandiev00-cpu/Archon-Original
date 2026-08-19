"use client";

import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      aria-labelledby="dashboard-error-title"
      className="grid min-h-[24rem] place-items-center rounded-3xl border border-rose-500/20 bg-rose-500/[0.06] p-6 text-center"
    >
      <div className="max-w-md">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-400">
          <AlertTriangle size={22} aria-hidden="true" />
        </span>
        <h1
          id="dashboard-error-title"
          className="mt-4 text-xl font-semibold text-zinc-100"
        >
          Deze pagina is tijdelijk niet beschikbaar
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Je gegevens zijn niet gewijzigd. Probeer de pagina opnieuw te laden
          of ga terug naar het Command Center.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={reset}
            className="justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Opnieuw proberen
          </Button>
          <Link
            href="/dashboard/command-center"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <Home size={16} aria-hidden="true" />
            Naar Command Center
          </Link>
        </div>
      </div>
    </section>
  );
}
