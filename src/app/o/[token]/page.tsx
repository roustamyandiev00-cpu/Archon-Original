import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublicOfferteHtml,
  isValidPublicOfferteToken,
} from "@/lib/offertes/publicOfferte";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  if (!isValidPublicOfferteToken(token)) {
    return { title: "Offerte niet gevonden", robots: { index: false, follow: false } };
  }
  return {
    title: "Offerte bekijken",
    robots: { index: false, follow: false },
  };
}

export default async function PublicOffertePage({ params }: PageProps) {
  const { token } = await params;

  if (!isValidPublicOfferteToken(token)) {
    notFound();
  }

  const result = await getPublicOfferteHtml(token);

  if (!result.ok) {
    if (result.reason === "expired") {
      return (
        <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
          <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-zinc-900/80 p-8 text-center">
            <h1 className="text-xl font-semibold">Link verlopen</h1>
            <p className="mt-3 text-sm text-zinc-400">
              Deze offerte-link is niet meer geldig. Vraag het bedrijf om een
              nieuwe link.
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
    notFound();
  }

  const pdfHref = `/o/${encodeURIComponent(token)}/pdf`;

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">
              Offerte {result.nummer}
            </p>
            <p className="truncate text-xs text-zinc-500">{result.bedrijfNaam}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={pdfHref}
              className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              PDF downloaden
            </a>
            <Link
              href="/"
              className="inline-flex rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              ArchonPro
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-2 py-4 sm:px-4">
        <iframe
          title={`Offerte ${result.nummer}`}
          srcDoc={result.html}
          className="h-[calc(100vh-7rem)] w-full rounded-xl border border-zinc-200 bg-white shadow-sm"
          sandbox=""
        />
      </div>
    </main>
  );
}
