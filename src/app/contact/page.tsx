import type { Metadata } from "next";
import { Mail, MessageCircle, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Contact — ArchonPro",
  description:
    "Vraag over ArchonPro, een demo of hulp nodig? Neem contact op met het team.",
};

const kanalen = [
  {
    icon: Mail,
    title: "E-mail",
    desc: "Voor vragen over je account, facturatie of het product.",
    action: { label: "support@archonpro.be", href: "mailto:support@archonpro.be" },
  },
  {
    icon: MessageCircle,
    title: "Demo aanvragen",
    desc: "Wil je ArchonPro eerst zien werken voor jouw bedrijf?",
    action: { label: "Plan een demo", href: "/#start" },
  },
  {
    icon: Clock,
    title: "Reactietijd",
    desc: "We reageren op werkdagen doorgaans binnen 1 werkdag.",
    action: null,
  },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          variant="panel"
          kicker={
            <>
              <Mail size={13} /> Contact
            </>
          }
          title="Vraag? We horen"
          accent="graag van je"
          subtitle="Of je nu een vraag hebt over prijzen, een demo wilt inplannen of hulp nodig hebt bij je account — het ArchonPro-team helpt je verder."
          primary={{ label: "Mail ons", href: "mailto:support@archonpro.be" }}
          secondary={{ label: "Bekijk prijzen", href: "/prijzen" }}
        />

        <section className="relative py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-6 sm:grid-cols-3">
              {kanalen.map((k) => (
                <div
                  key={k.title}
                  className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <k.icon size={18} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-zinc-100">
                    {k.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {k.desc}
                  </p>
                  {k.action && (
                    <a
                      href={k.action.href}
                      className="mt-4 inline-block text-sm font-medium text-sky-400 transition-colors hover:text-sky-300"
                    >
                      {k.action.label} →
                    </a>
                  )}
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
