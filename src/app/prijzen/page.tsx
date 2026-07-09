import type { Metadata } from "next";
import { Tag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Pricing from "@/components/Pricing";

export const metadata: Metadata = {
  title: "Prijzen — Pakketten voor vakmensen | ArchonPro",
  description:
    "Kies een ArchonPro-pakket dat past bij je bedrijf: Starter, Pro of Business. Van offertes en facturen tot projectopvolging, klantenportaal en slimme automatisering. 14 dagen gratis proberen.",
};

export default function PrijzenPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          variant="spotlight"
          kicker={
            <>
              <Tag size={13} /> Prijzen &amp; functies
            </>
          }
          title="Eén werkruimte, één"
          accent="heldere prijs"
          subtitle="Van eenvoudige offertes en facturen tot projectopvolging, klantenportaal en slimme automatisering. Kies het pakket dat past bij je bedrijf — later opschalen kan altijd."
          primary={{ label: "Start 14 dagen gratis", href: "/register" }}
          secondary={{ label: "Bekijk de pakketten", href: "#prijzen" }}
          note="Geen creditcard nodig · Maandelijks opzegbaar"
        />
        <Pricing showIntro={false} />
      </main>
      <Footer />
    </>
  );
}
