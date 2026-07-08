import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
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
    .select("titel, samenvatting, inhoud, type, auteur, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!article) notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <Link
          href="/#blog"
          className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft
            size={15}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Terug naar blog
        </Link>

        <p className="mt-8 text-xs uppercase tracking-wide text-sky-400">
          {article.type ?? "blog"}
        </p>
        <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-zinc-50">
          {article.titel}
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          {formatDate(article.published_at)}
          {article.auteur ? ` · ${article.auteur}` : ""}
        </p>

        {article.samenvatting && (
          <p className="mt-8 text-lg leading-8 text-zinc-300">
            {article.samenvatting}
          </p>
        )}

        {article.inhoud && (
          <div className="mt-6 whitespace-pre-line text-base leading-8 text-zinc-400">
            {article.inhoud}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
