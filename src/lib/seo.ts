import type { Metadata } from "next";

export const SITE_NAME = "ArchonPro";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://archonpro.be";

export const DEFAULT_DESCRIPTION =
  "CRM, offertes en Peppol e-facturatie voor Belgische bouwbedrijven. Minder administratie, sneller factureren — 14 dagen gratis proberen.";

/** Fallback OG-afbeelding (1200×630 aanbevolen voor social previews). */
export const DEFAULT_OG_IMAGE = "/archonpro_intro_premium_preview.jpg";

export const DEFAULT_KEYWORDS = [
  "CRM bouwbedrijf",
  "facturatie bouw",
  "offertes bouw",
  "Peppol e-facturatie",
  "e-facturatie België",
  "bouwsoftware",
  "KBO facturatie",
  "UBL factuur",
  "bouw KMO",
  "ArchonPro",
];

/** Publieke marketing- en contentpagina's voor sitemap.xml. */
export const PUBLIC_ROUTES: {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/prijzen", changeFrequency: "monthly", priority: 0.9 },
  { path: "/register", changeFrequency: "monthly", priority: 0.85 },
  { path: "/functies", changeFrequency: "monthly", priority: 0.9 },
  { path: "/functies/peppol", changeFrequency: "monthly", priority: 0.95 },
  { path: "/functies/facturen", changeFrequency: "monthly", priority: 0.85 },
  { path: "/functies/schatting", changeFrequency: "monthly", priority: 0.85 },
  { path: "/functies/ai-metgezel", changeFrequency: "monthly", priority: 0.8 },
  { path: "/functies/integraties", changeFrequency: "monthly", priority: 0.8 },
  { path: "/bouwnetwerk", changeFrequency: "daily", priority: 0.85 },
  { path: "/bouwmaterialen", changeFrequency: "weekly", priority: 0.75 },
  { path: "/dakbedrijven", changeFrequency: "weekly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/gemeenschap", changeFrequency: "weekly", priority: 0.7 },
  { path: "/over", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.65 },
  { path: "/ontwikkelaars", changeFrequency: "monthly", priority: 0.55 },
  { path: "/vacatures", changeFrequency: "monthly", priority: 0.5 },
  { path: "/juridisch", changeFrequency: "yearly", priority: 0.3 },
];

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(input.path);
  const image = input.ogImage ?? DEFAULT_OG_IMAGE;

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      type: input.type ?? "website",
      locale: "nl_BE",
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ArchonPro — CRM en facturatie voor bouwbedrijven",
    template: "%s",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "business",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "ArchonPro — CRM en facturatie voor bouwbedrijven",
    description: DEFAULT_DESCRIPTION,
    type: "website",
    locale: "nl_BE",
    siteName: SITE_NAME,
    url: SITE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArchonPro — CRM en facturatie voor bouwbedrijven",
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/favicon.ico"),
    description: DEFAULT_DESCRIPTION,
    areaServed: { "@type": "Country", name: "Belgium" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@archonpro.be",
      availableLanguage: ["Dutch", "French"],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "nl-BE",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/blog")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "14 dagen gratis proefperiode",
    },
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    inLanguage: "nl-BE",
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Belgische bouwbedrijven en vakmensen",
    },
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  datePublished?: string | null;
  author?: string | null;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    datePublished: input.datePublished ?? undefined,
    author: input.author
      ? { "@type": "Person", name: input.author }
      : { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/favicon.ico") },
    },
    image: input.image ? absoluteUrl(input.image) : absoluteUrl(DEFAULT_OG_IMAGE),
    inLanguage: "nl-BE",
  };
}
