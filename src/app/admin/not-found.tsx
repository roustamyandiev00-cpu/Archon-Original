import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function AdminNotFound() {
  return (
    <section
      aria-labelledby="admin-not-found-title"
      className="grid min-h-[24rem] place-items-center rounded-3xl border border-white/10 bg-zinc-900/50 p-6 text-center"
    >
      <div className="max-w-md">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-300">
          <SearchX size={22} aria-hidden="true" />
        </span>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
          Pagina niet gevonden
        </p>
        <h1
          id="admin-not-found-title"
          className="mt-2 text-xl font-semibold text-zinc-100"
        >
          Deze beheerpagina bestaat niet
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          De link is mogelijk verouderd of de beheerpagina is verplaatst.
        </p>
        <Link
          href="/admin"
          className="mx-auto mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Terug naar CEO Console
        </Link>
      </div>
    </section>
  );
}
