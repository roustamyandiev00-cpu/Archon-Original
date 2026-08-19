import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingCalculator from "@/components/PricingCalculator";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Prijzen — CRM voor bouwbedrijven | ArchonPro",
  description:
    "Transparante prijzen voor Belgische bouw-KMO's. Starter, Pro en Business — inclusief Peppol e-facturatie. Stel je eigen pakket samen en zie de prijs direct. 14 dagen gratis proberen.",
  path: "/prijzen",
  keywords: ["CRM prijzen bouw", "facturatie software prijs", "Peppol kosten"],
});

export default function PrijzenPage() {
  return (
    <div className="prijzen-light min-h-screen bg-white text-zinc-900">
      <Navbar theme="light" />
      <main>
        <PricingCalculator showIntro />
      </main>
      <Footer theme="light" />
    </div>
  );
}
