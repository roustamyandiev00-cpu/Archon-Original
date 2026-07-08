import type { Metadata } from "next";
import { ArrowRight, Plug, Check, Search, LifeBuoy } from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Integraties — ArchonPro koppelt met je bouwsoftware",
  description:
    "ArchonPro is compatibel met de meeste boekhoud- en bouwsoftware. Controleer hier de compatibiliteit met je bestaande tools. Export naar PDF, Excel, CSV en Peppol.",
};

const software = [
  "Billit",
  "Yuki",
  "Exact Online",
  "Teamleader",
  "Octopus",
  "WinBooks",
  "Silverfin",
  "CodaBox",
  "Horus",
  "Sage BOB 50",
  "Clearfacts",
  "Bouwsoft",
  "Vertuoza",
  "Isabel 6",
  "Peppol",
];

export default function IntegratiesPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SoftwareGrid />
        <NotFound />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

function Hero() {
  return (
    <PageHero
      variant="mesh"
      kicker={
        <>
          <Plug size={13} className="text-cyan-300" /> Integraties
        </>
      }
      title="ArchonPro koppelt met je favoriete"
      accent="bouwsoftware"
      subtitle="Compatibel met de meeste offerte- en facturatiesoftware op de markt. Controleer hier de compatibiliteit met je bestaande tools."
      primary={{ label: "Gratis account aanmaken", href: "/#start" }}
      secondary={{ label: "Bekijk onze importgidsen", href: "#software" }}
      visual={
        <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-xl sm:p-6">
          <div className="grid grid-cols-3 gap-3">
            {software.slice(0, 9).map((name) => (
              <div
                key={name}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-center"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sm font-bold text-sky-400 ring-1 ring-inset ring-white/10">
                  {name.charAt(0)}
                </span>
                <span className="truncate text-xs text-zinc-300">{name}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-zinc-500">
            + Peppol, Excel &amp; CSV
          </p>
        </div>
      }
    />
  );
}

function SoftwareGrid() {
  return (
    <section id="software" className="relative py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-sky-400">Compatibele software</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Software die met ArchonPro werkt
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Vind je de jouwe niet terug? Contacteer onze support.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {software.map((name) => (
            <div
              key={name}
              className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/50 p-5 transition-colors hover:border-sky-500/40 hover:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sm font-bold text-sky-400 ring-1 ring-inset ring-white/10">
                  {name.charAt(0)}
                </span>
                <span className="font-semibold text-zinc-50">{name}</span>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <Check size={12} /> Compatibel
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors group-hover:text-sky-400">
                  Meer weten <ArrowRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NotFound() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-8 text-center sm:p-12">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-400 ring-1 ring-inset ring-white/10">
            <Search size={22} />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-50">
            Vind je je software niet?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-400">
            ArchonPro exporteert naar Excel en CSV, compatibel met de meeste
            bouwtools, en verstuurt via Peppol. Ons team helpt je graag verder.
          </p>
          <a
            href="/#start"
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
          >
            <LifeBuoy size={16} className="text-sky-400" />
            Contacteer de support
          </a>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 px-6 py-16 text-center sm:px-12">
          <div className="aurora-glow opacity-80" />
          <div className="relative z-10">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Één keer invoeren. Overal terugvinden.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
              14 dagen gratis proberen. Zonder creditcard. Zonder verplichting.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/#start"
                className="group inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400"
              >
                Gratis account aanmaken
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>
              <a
                href="/functies/facturen"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
              >
                Meer over facturen
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
