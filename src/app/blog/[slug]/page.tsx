import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero, { type HeroVariant } from "@/components/PageHero";
import JsonLd from "@/components/seo/JsonLd";
import { createClient } from "@/lib/supabase/server";
import { articleJsonLd, buildPageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const variantByType: Record<string, HeroVariant> = {
  blog: "amber",
  tips: "spotlight",
  nieuws: "violet",
  update: "mesh",
};

const fallbackAfbeeldingen: Record<string, string> = {
  "sneller-offertes-met-ai": "/blog/sneller-offertes-met-ai.png",
  "e-facturatie-peppol": "/blog/e-facturatie-peppol.png",
  "5-tips-snellere-betalingen": "/blog/5-tips-snellere-betalingen.png",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: article } = await supabase
    .from("artikelen")
    .select("titel, samenvatting, afbeelding_url, thumbnail_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!article) {
    return { title: "Artikel niet gevonden | ArchonPro" };
  }

  const image =
    article.afbeelding_url ??
    article.thumbnail_url ??
    fallbackAfbeeldingen[slug] ??
    undefined;

  return buildPageMetadata({
    title: `${article.titel} | ArchonPro Blog`,
    description:
      article.samenvatting ??
      "Tips en nieuws over CRM, facturatie en Peppol voor Belgische bouwbedrijven.",
    path: `/blog/${slug}`,
    type: "article",
    ogImage: image,
    keywords: ["bouw CRM", "facturatie", "Peppol", "ArchonPro blog"],
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("artikelen")
    .select(
      "titel, samenvatting, inhoud, type, auteur, published_at, afbeelding_url, thumbnail_url",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!article) notFound();

  const type = article.type ?? "blog";
  const variant = variantByType[type] ?? "amber";
  const meta = [
    formatDate(article.published_at),
    article.auteur ? article.auteur : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const image =
    article.afbeelding_url ??
    article.thumbnail_url ??
    fallbackAfbeeldingen[slug] ??
    null;

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          title: article.titel,
          description: article.samenvatting ?? "",
          path: `/blog/${slug}`,
          datePublished: article.published_at,
          author: article.auteur,
          image,
        })}
      />
      <Navbar />
      <main>
        <PageHero
          variant={variant}
          backLink={{ label: "Terug naar blog", href: "/blog" }}
          kicker={
            <>
              <BookOpen size={13} /> {type}
            </>
          }
          title={article.titel}
          subtitle={article.samenvatting ?? "Lees het volledige artikel hieronder."}
          meta={meta || undefined}
          showCtas={false}
        />

        {article.inhoud && (
          <section className="mx-auto max-w-3xl px-6 py-16">
            <article className="whitespace-pre-line text-base leading-8 text-zinc-400">
              {article.inhoud}
            </article>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
