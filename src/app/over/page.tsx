import type { Metadata } from "next";
import { Building2, Target, Users, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Over ArchonPro — CRM gemaakt voor de bouw",
  description:
    "ArchonPro is de CRM-werkruimte voor zelfstandige vakmensen in bouw, renovatie, installatie en onderhoud. Ontdek waarom we het bouwen.",
};

const values = [
  {
    icon: Target,
    title: "Gebouwd voor de werf, niet voor het kantoor",
    desc: "Elke feature vertrekt vanuit één vraag: helpt dit een vakman sneller een offerte maken, een factuur versturen of een project opvolgen — ook vanaf zijn gsm.",
  },
  {
    icon: Users,
    title: "Gemaakt met bouwbedrijven, niet enkel voor hen",
    desc: "We bouwen ArchonPro samen met zelfstandige aannemers en kmo's in België. Hun feedback bepaalt wat we vandaag bouwen en morgen prioriteren.",
  },
  {
    icon: Building2,
    title: "Eén werkruimte in plaats van tien losse tools",
    desc: "Geen losse WhatsApp-berichten, Excel-lijsten en e-mailbijlagen meer. Offertes, klanten, projecten en facturen op één plek.",
  },
];

export default function OverPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          variant="spotlight"
          kicker={
            <>
              <Building2 size={13} /> Over ArchonPro
            </>
          }
          title="De CRM-werkruimte voor"
          accent="bouwbedrijven"
          subtitle="ArchonPro is ontstaan uit een simpele frustratie: te veel zelfstandige vakmensen verliezen tijd aan administratie in plaats van aan hun vak. Wij bouwen de tool die dat oplost."
          primary={{ label: "Start gratis", href: "/register" }}
          secondary={{ label: "Neem contact op", href: "/contact" }}
        />

        <section className="relative py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-6 sm:grid-cols-3">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                    <v.icon size={18} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-zinc-100">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-14 rounded-3xl border border-white/10 bg-zinc-900/60 p-8 text-center sm:p-12">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
                Nieuwsgierig hoe ArchonPro jouw bedrijf kan helpen?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">
                Probeer het 14 dagen gratis, zonder creditcard, of stel ons
                een vraag.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400"
                >
                  Gratis proberen
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
