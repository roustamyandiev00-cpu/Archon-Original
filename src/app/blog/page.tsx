import type { Metadata } from "next";
import { Suspense } from "react";
import { Newspaper } from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Blog from "@/components/Blog";
import Footer from "@/components/Footer";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Blog — Tips voor bouwbedrijven | ArchonPro",
  description:
    "Tips, updates en verhalen over offertes, Peppol e-facturatie, CRM en AI voor Belgische bouwbedrijven en vakmensen.",
  path: "/blog",
  keywords: ["bouw blog", "Peppol tips", "facturatie bouw", "CRM tips"],
});

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          variant="spotlight"
          kicker={
            <>
              <Newspaper size={13} /> Blog
            </>
          }
          title="Slimmer werken"
          accent="in de bouw"
          subtitle="Tips, updates en verhalen over offertes, facturatie en AI voor zelfstandige vakmensen."
          primary={{ label: "Start gratis", href: "/register" }}
          secondary={{ label: "Alle functies", href: "/functies" }}
        />
        <Suspense>
          <Blog limit={12} showIntro={false} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
