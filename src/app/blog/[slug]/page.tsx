import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero, { type HeroVariant } from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";
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

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("artikelen")
    .select("titel, samenvatting, inhoud, type, auteur, published_at")
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

  return (
    <>
      <Navbar />
      <main>
        <PageHero
          variant={variant}
          backLink={{ label: "Terug naar blog", href: "/#blog" }}
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
            <div className="whitespace-pre-line text-base leading-8 text-zinc-400">
              {article.inhoud}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
