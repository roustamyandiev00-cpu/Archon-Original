import Link from "next/link";

export default function PublicOfferteNotFound() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
      <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-zinc-900/80 p-8 text-center">
        <h1 className="text-xl font-semibold">Offerte niet gevonden</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Deze link is ongeldig of bestaat niet. Controleer de URL of vraag het
          bedrijf om een nieuwe offerte-link.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950"
        >
          Naar ArchonPro
        </Link>
      </div>
    </main>
  );
}
