import Image from "next/image";
import { ArrowUpRight, Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const fallbackAfbeeldingen: Record<string, string> = {
  "sneller-offertes-met-ai": "/blog/sneller-offertes-met-ai.png",
  "e-facturatie-peppol": "/blog/e-facturatie-peppol.png",
  "5-tips-snellere-betalingen": "/blog/5-tips-snellere-betalingen.png",
};

export default async function Blog() {
  const supabase = await createClient();
  const { data: artikelen } = await supabase
    .from("artikelen")
    .select(
      "id, titel, slug, samenvatting, type, auteur, published_at, afbeelding_url, thumbnail_url",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(3);

  if (!artikelen || artikelen.length === 0) return null;

  return (
    <section id="blog" className="section-tint relative py-24">
      <div aria-hidden className="section-edge" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            <Newspaper size={14} className="text-sky-400" />
            Blog &amp; nieuws
          </span>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Slimmer werken in de bouw
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Tips, updates en verhalen over offertes, facturatie en AI voor
            zelfstandige vakmensen.
          </p>
        </div>

        <div className="section-surface mt-12 grid gap-4 p-2 md:grid-cols-3 md:gap-5">
          {artikelen.map((a) => {
            const afbeelding =
              a.afbeelding_url ?? a.thumbnail_url ?? fallbackAfbeeldingen[a.slug] ?? null;
            return (
            <a
              key={a.id}
              href={`/blog/${a.slug}`}
              className="card-subtle group flex flex-col overflow-hidden transition-colors hover:border-white/10"
            >
              <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-sky-500/20 via-indigo-500/15 to-transparent">
                {afbeelding ? (
                  <Image
                    src={afbeelding}
                    alt={a.titel}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <Newspaper size={28} className="text-sky-300/70" />
                )}
                <span className="absolute left-3 top-3 z-10 rounded-full bg-zinc-950/60 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-300 backdrop-blur">
                  {a.type ?? "blog"}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs text-zinc-500">
                  {formatDate(a.published_at)}
                  {a.auteur ? ` · ${a.auteur}` : ""}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-zinc-100">
                  {a.titel}
                </h3>
                {a.samenvatting && (
                  <p className="mt-2 line-clamp-3 text-sm text-zinc-400">
                    {a.samenvatting}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-400">
                  Lees meer
                  <ArrowUpRight
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </div>
            </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
