import type { Metadata } from "next";
import { Briefcase, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Vacatures — ArchonPro",
  description:
    "Momenteel geen openstaande vacatures bij ArchonPro. Stuur gerust een open sollicitatie.",
};

export default function VacaturesPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          variant="violet"
          kicker={
            <>
              <Briefcase size={13} /> Vacatures
            </>
          }
          title="Momenteel geen"
          accent="openstaande vacatures"
          subtitle="ArchonPro groeit — er komen binnenkort nieuwe rollen bij. Ben je geïnteresseerd om mee te bouwen aan de CRM voor bouwbedrijven? Stuur ons gerust een open sollicitatie."
          primary={{
            label: "Open sollicitatie sturen",
            href: "mailto:jobs@archonpro.be",
          }}
          secondary={{ label: "Meer over ArchonPro", href: "/over" }}
          note="jobs@archonpro.be"
        />

        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Mail size={20} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Vertel ons kort wie je bent en wat je goed kan — we bewaren
              open sollicitaties en nemen contact op zodra er een passende
              rol vrijkomt.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
