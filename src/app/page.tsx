import PrefetchRoutes from "@/components/PrefetchRoutes";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Realtime from "@/components/Realtime";
import Genius from "@/components/Genius";
import HomepageWorkflow from "@/components/HomepageWorkflow";
import Footer from "@/components/Footer";
import JsonLd from "@/components/seo/JsonLd";
import {
  buildPageMetadata,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: "ArchonPro — CRM en facturatie voor bouwbedrijven",
  description:
    "Bespaar wekelijks uren administratie. Offertes, klantportaal, Peppol e-facturatie en projectopvolging — speciaal voor Belgische bouw-KMO's. 14 dagen gratis.",
  path: "/",
  keywords: [
    "CRM bouwbedrijf België",
    "facturatie software bouw",
    "Peppol e-facturatie 2026",
    "offertes bouwbedrijf",
    "bouwsoftware KMO",
  ],
});

export default function Home() {
  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(),
          softwareApplicationJsonLd(),
        ]}
      />
      <PrefetchRoutes />
      <Navbar variant="executive" />
      <main className="bg-[#030914]">
        <Hero />
        <HomepageWorkflow />
        <Features />
        <Realtime />
        <Genius />
      </main>
      <Footer />
    </>
  );
}
