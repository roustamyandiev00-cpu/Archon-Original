import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import CommunityWall from "@/components/CommunityWall";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Community — Deel je mening | ArchonPro",
  description:
    "Deel feedback, ideeën of tips met andere vakmensen. Help ArchonPro beter te maken voor bouwbedrijven in België.",
};

export default function GemeenschapPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          variant="spotlight"
          kicker={
            <>
              <MessageCircle size={13} /> Community
            </>
          }
          title="Vertel ons wat je denkt —"
          accent="we luisteren echt"
          subtitle="Of je nu een compliment deelt, een idee hebt of gewoon wilt zeggen wat beter kan: elke mening helpt ArchonPro sterker te maken voor bouwbedrijven in België."
          primary={{ label: "Schrijf je bericht", href: "#gemeenschap" }}
          secondary={{ label: "Start gratis", href: "/register" }}
        />
        <CommunityWall showIntro={false} />
      </main>
      <Footer />
    </>
  );
}
