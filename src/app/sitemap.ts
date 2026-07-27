import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_ROUTES, absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("artikelen")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    blogEntries =
      data?.map((article) => ({
        url: absoluteUrl(`/blog/${article.slug}`),
        lastModified: new Date(article.updated_at ?? article.published_at ?? now),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })) ?? [];
  } catch {
    // Sitemap blijft bruikbaar zonder blog-entries als Supabase niet bereikbaar is.
  }

  return [...staticEntries, ...blogEntries];
}

// Expliciet voor crawlers — sitemap moet altijd op productiedomein wijzen.
export const revalidate = 3600;
