"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="grid min-h-[24rem] place-items-center rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-center"
    >
      <div className="max-w-md">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-400">
          <AlertTriangle size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-zinc-100">
          Platformgegevens niet beschikbaar
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          De beheerdata kon niet veilig worden geladen. Er worden geen lege of
          geschatte resultaten getoond.
        </p>
        <Button type="button" className="mt-5" onClick={reset}>
          <RotateCcw size={16} aria-hidden="true" />
          Opnieuw proberen
        </Button>
      </div>
    </section>
  );
}
