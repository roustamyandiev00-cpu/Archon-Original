"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-lg rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-6 text-center"
    >
      <p className="text-sm font-semibold text-zinc-100">
        Deze pagina kon niet laden
      </p>
      <p className="mt-2 text-sm text-zinc-400">
        {error.message || "Er ging iets mis bij het ophalen van je gegevens."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400"
      >
        Opnieuw proberen
      </button>
    </div>
  );
}
