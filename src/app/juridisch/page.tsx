import type { Metadata } from "next";
import { Scale } from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Juridisch — Privacy, voorwaarden & GDPR | ArchonPro",
  description:
    "Privacybeleid, algemene voorwaarden, cookiebeleid en GDPR-informatie van ArchonPro.",
};

const secties = [
  {
    id: "privacy",
    title: "Privacybeleid",
    body: [
      "ArchonPro verzamelt enkel de gegevens die nodig zijn om de dienst te leveren: accountgegevens, bedrijfsgegevens en de data die je zelf invoert (offertes, klanten, projecten, facturen).",
      "We verkopen geen persoonsgegevens aan derden. Gegevens worden opgeslagen bij EU-gehoste infrastructuur en enkel gebruikt om ArchonPro te laten werken en te verbeteren.",
      "Voor vragen over je gegevens kan je altijd contact opnemen via support@archonpro.be.",
    ],
  },
  {
    id: "voorwaarden",
    title: "Algemene voorwaarden",
    body: [
      "Door een ArchonPro-account aan te maken ga je akkoord met eerlijk gebruik van het platform en respecteer je de rechten van andere gebruikers op het Bouwnetwerk.",
      "Abonnementen zijn maandelijks opzegbaar, tenzij anders overeengekomen. Er geldt geen verplichte minimumduur bij het Starter- en Pro-pakket.",
      "ArchonPro behoudt het recht om accounts die misbruik maken van het platform (spam, fraude, illegale content) te schorsen.",
    ],
  },
  {
    id: "cookies",
    title: "Cookiebeleid",
    body: [
      "ArchonPro gebruikt functionele cookies om je ingelogd te houden en je voorkeuren te onthouden. Deze zijn noodzakelijk voor de werking van het platform.",
      "We gebruiken geen advertentiecookies en volgen je niet over andere websites heen.",
      "Analytische cookies (indien actief) worden enkel gebruikt om het product te verbeteren en zijn te allen tijde te weigeren via je browserinstellingen.",
    ],
  },
  {
    id: "gdpr",
    title: "GDPR",
    body: [
      "ArchonPro is gebouwd met GDPR-conformiteit als uitgangspunt. Als vakman ben je zelf verwerkingsverantwoordelijke voor de klantgegevens die je in ArchonPro invoert; ArchonPro treedt op als verwerker.",
      "Je hebt steeds recht op inzage, correctie en verwijdering van je gegevens. Een verzoek daartoe kan via support@archonpro.be.",
      "Op aanvraag stellen we een verwerkersovereenkomst (DPA) beschikbaar voor Pro- en Business-klanten.",
    ],
  },
];

export default function JuridischPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          variant="slate"
          kicker={
            <>
              <Scale size={13} /> Juridisch
            </>
          }
          title="Privacy, voorwaarden"
          accent="en GDPR"
          subtitle="Duidelijke afspraken over hoe ArchonPro met jouw gegevens en die van je klanten omgaat."
          showCtas={false}
        />

        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex flex-col gap-16">
              {secties.map((s) => (
                <div key={s.id} id={s.id} className="scroll-mt-28">
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-50">
                    {s.title}
                  </h2>
                  <div className="mt-4 flex flex-col gap-3">
                    {s.body.map((p, i) => (
                      <p
                        key={i}
                        className="text-sm leading-relaxed text-zinc-400"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
