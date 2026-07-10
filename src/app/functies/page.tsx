import type { Metadata } from "next";
import { Layers } from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Features from "@/components/Features";
import Realtime from "@/components/Realtime";
import Genius from "@/components/Genius";
import Footer from "@/components/Footer";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Functies — CRM voor bouwbedrijven | ArchonPro",
  description:
    "Offertes, facturen, Peppol e-facturatie, projectopvolging, AI-inbox en automatisering — alles wat Belgische bouwbedrijven nodig hebben in één CRM-werkruimte.",
  path: "/functies",
  keywords: ["CRM functies bouw", "bouwsoftware features", "offertes facturen"],
});

export default function FunctiesPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          variant="spotlight"
          kicker={
            <>
              <Layers size={13} /> Functies
            </>
          }
          title="Alles wat je nodig hebt."
          accent="Niets wat je niet nodig hebt."
          subtitle="Van eerste aanvraag tot betaalde factuur — beheer je hele bedrijf in één werkruimte die aanvoelt als een fluitje van een cent."
          primary={{ label: "Start 14 dagen gratis", href: "/register" }}
          secondary={{ label: "Bekijk demo", href: "/dashboard/voorbeeld" }}
        />
        <Features />
        <Realtime />
        <Genius />
      </main>
      <Footer />
    </>
  );
}
