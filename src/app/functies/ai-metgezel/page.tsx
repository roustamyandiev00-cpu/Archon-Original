import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Mic,
  Brain,
  Smartphone,
  Globe,
  Lightbulb,
  FileText,
  Receipt,
  Check,
  Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "AI-metgezel — Nova maakt je offertes | ArchonPro",
  description:
    "Praat, stuur je documenten, geef je instructies… Nova zet je uren achter de computer om in minuten op je gsm. Offertes & facturen met AI.",
};

const stats = [
  { value: "10 u", label: "bespaard per week met spraakherkenning" },
  { value: "+15%", label: "per offerte dankzij de suggesties van Nova" },
  { value: "+30%", label: "getekende offertes — vollediger en sneller verstuurd" },
  { value: "+10K", label: "vakmensen maken hun offertes al met AI" },
];

export default function AiMetgezelPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProcessSection />
        <RealitySection />
        <AssistSection />
        <QuoteSection />
        <MidCta />
        <TradesSection />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

function Hero() {
  return (
    <PageHero
      variant="aurora"
      kicker={
        <>
          <Sparkles size={13} className="text-indigo-300" /> AI-metgezel · ArchonPro
        </>
      }
      title="Het beste van AI voor het opstellen van"
      accent="offertes & facturen"
      subtitle="Praat, stuur je documenten, geef je instructies… Nova zet je uren achter de computer om in minuten op je gsm."
      primary={{ label: "Gratis proberen", href: "/#start" }}
      secondary={{ label: "Hoe werkt het?", href: "#hoe" }}
      note="+10.000 vakmensen maken hun offertes met Nova"
      visual={
        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-xl sm:p-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"
            >
              <p className="text-2xl font-semibold text-gradient">{s.value}</p>
              <p className="mt-1.5 text-xs leading-snug text-zinc-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      }
    />
  );
}

function SectionHeading({
  kicker,
  title,
  desc,
}: {
  kicker: string;
  title: React.ReactNode;
  desc: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium text-sky-400">{kicker}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-lg text-zinc-400">{desc}</p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
      {children}
    </div>
  );
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-400 ring-1 ring-inset ring-white/10">
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
      {children}
    </span>
  );
}

function ProcessSection() {
  return (
    <section id="hoe" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          kicker="AI-functies"
          title="Nova automatiseert de verwerking van informatie"
          desc="Spraak, tekst, foto, document — het maakt niet uit hoe je je werken beschrijft. Nova begrijpt, analyseert en zet je instructies om in een gestructureerde offerte."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <Card>
            <IconBadge>
              <Mic size={20} />
            </IconBadge>
            <h3 className="mt-5 text-lg font-semibold text-zinc-50">
              Spraak, tekst, foto of document
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Beschrijf je werken zoals het je natuurlijk afgaat — met je stem op
              de werf, per tekst vanuit je zetel, door je handgeschreven notities
              te fotograferen of door direct een meetstaat te importeren.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Chip>🎙️ Spraaknotitie</Chip>
              <Chip>✏️ Vrije tekst</Chip>
              <Chip>📷 Foto</Chip>
              <Chip>📄 Meetstaat</Chip>
              <Chip>📎 PDF</Chip>
            </div>
          </Card>

          <Card>
            <IconBadge>
              <Brain size={20} />
            </IconBadge>
            <h3 className="mt-5 text-lg font-semibold text-zinc-50">
              Nova begrijpt en vat samen
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Nova transcribeert niet zomaar — ze analyseert, begrijpt het
              bouwvocabulaire, koppelt de info aan je prijzenbibliotheek en
              structureert in seconden een bruikbare offerte.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4 text-sm text-zinc-300">
                🎙️ &ldquo;Uitbraak tegels 35 m², plaatsing keramisch 60×60…&rdquo;
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  <Check size={13} /> Nova begreep: 4 gestructureerde lijnen
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
                  <Clock size={13} /> Offerte klaar in 22 seconden
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function RealitySection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          kicker="Altijd bij de hand"
          title="Nova past zich aan jouw werkelijkheid en vak aan"
          desc="Onderweg, op kantoor of in de wagen — Nova is waar jij bent. 24/7 bereikbaar en ze verstaat jouw taal."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <Card>
            <IconBadge>
              <Smartphone size={20} />
            </IconBadge>
            <h3 className="mt-5 text-lg font-semibold text-zinc-50">
              Overal beschikbaar, 24/7
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Mobiele app voor iOS &amp; Android, webinterface op je computer, of
              rechtstreeks via WhatsApp — Nova is bereikbaar waar je ook bent,
              zelfs op de werf tussen twee interventies door.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { t: "Mobiele app", s: "iOS & Android" },
                { t: "Webinterface", s: "Browser" },
                { t: "WhatsApp", s: "Spraakbericht" },
              ].map((c) => (
                <div
                  key={c.t}
                  className="rounded-xl border border-white/5 bg-white/[0.03] p-3"
                >
                  <p className="text-sm font-medium text-zinc-100">{c.t}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{c.s}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <IconBadge>
              <Globe size={20} />
            </IconBadge>
            <h3 className="mt-5 text-lg font-semibold text-zinc-50">
              Spreek je eigen taal, Nova schrijft in het Nederlands
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Op de werf spreekt niet iedereen Nederlands. Beschrijf je werken in
              je eigen taal — Nova begrijpt en genereert een professionele
              offerte in het Nederlands, klaar om naar de klant te sturen.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Chip>🇵🇱 Pools</Chip>
              <Chip>🇵🇹 Portugees</Chip>
              <Chip>🇹🇷 Turks</Chip>
              <Chip>🇲🇦 Arabisch</Chip>
              <Chip>🇷🇴 Roemeens</Chip>
              <Chip>+ andere</Chip>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function AssistSection() {
  const suggestions = [
    { t: "Uitbraak bestaande tegels", s: "Toegevoegd", done: true },
    { t: "Egaliseren ondergrond", s: "Te bevestigen" },
    { t: "Epoxyvoegen + afwerking", s: "Te bevestigen" },
    { t: "Afvoer puin", s: "Te bevestigen" },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          kicker="Actieve partner"
          title="Nova helpt je actief bij je calculatie"
          desc="Nova voert niet alleen uit — ze stelt voor, vult aan en verrijkt. Een echte calculatiepartner, geen invoertool."
        />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <IconBadge>
              <Lightbulb size={20} />
            </IconBadge>
            <h3 className="mt-5 text-xl font-semibold text-zinc-50">
              Suggesties voor prestaties
            </h3>
            <p className="mt-3 text-zinc-400">
              Nova analyseert de context van je werf en stelt automatisch de
              aanvullende prestaties voor die je vergeten zou kunnen zijn.
              Vollediger offertes, minder vergeten, betere rentabiliteit.
            </p>
            <p className="mt-4 text-sm text-zinc-500">
              Voorbeeld: je dicteert &ldquo;tegels plaatsen badkamer&rdquo; — Nova
              stelt de uitbraak van de oude tegels, het egaliseren en de
              epoxyvoegen voor.
            </p>
          </div>

          <Card>
            <div className="flex items-center gap-2 text-zinc-400">
              <Sparkles size={16} className="text-sky-400" />
              <span className="text-sm">Suggesties van Nova</span>
            </div>
            <div className="mt-5 space-y-2.5">
              {suggestions.map((s) => (
                <div
                  key={s.t}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                >
                  <span className="text-sm text-zinc-200">{s.t}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      s.done
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-white/5 text-zinc-400"
                    }`}
                  >
                    {s.done && <Check size={12} />} {s.s}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function QuoteSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          kicker="Volledige cyclus"
          title="Nova hertekent het opstellen van offertes"
          desc="Van spraaknotitie tot getekende offerte, en dan tot factuur — Nova regisseert de hele commerciële cyclus van je werven, zonder herinvoer, zonder tijdverlies."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <Card>
            <IconBadge>
              <FileText size={20} />
            </IconBadge>
            <h3 className="mt-5 text-lg font-semibold text-zinc-50">
              Gestructureerde offertes in 2 minuten
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Nova genereert volledige offertes met alle werklijnen, je tarieven,
              de btw en de wettelijke vermeldingen. Logo, kleuren,
              betalingsvoorwaarden — alles personaliseerbaar in jouw huisstijl.
            </p>
            <div className="mt-6 rounded-2xl border border-white/5 bg-zinc-950/60 p-4">
              <Row k="Status" v="Offerte verstuurd ✓" tone="emerald" />
              <Row k="Klant" v="Van Dijck Bouw" />
              <Row k="Bedrag incl. btw" v="€ 4.820" />
            </div>
          </Card>

          <Card>
            <IconBadge>
              <Receipt size={20} />
            </IconBadge>
            <h3 className="mt-5 text-lg font-semibold text-zinc-50">
              Facturen automatisch gegenereerd
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Zet een aanvaarde offerte met één klik om in een factuur. Nova neemt
              alle info over, beheert voorschotten en saldofacturen. Conform
              e-facturatie via Peppol.
            </p>
            <div className="mt-6 rounded-2xl border border-white/5 bg-zinc-950/60 p-4">
              <Row k="Offerte aanvaard" v="→ Factuur in 1 klik" tone="sky" />
              <Row k="Voorschot 30%" v="Verstuurd ✓" tone="emerald" />
              <Row k="E-facturatie (Peppol)" v="Conform ✓" tone="emerald" />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Row({
  k,
  v,
  tone,
}: {
  k: string;
  v: string;
  tone?: "emerald" | "sky";
}) {
  const toneCls =
    tone === "emerald"
      ? "text-emerald-400"
      : tone === "sky"
        ? "text-sky-400"
        : "text-zinc-100";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-sm text-zinc-500">{k}</span>
      <span className={`text-sm font-medium ${toneCls}`}>{v}</span>
    </div>
  );
}

function MidCta() {
  return (
    <section className="relative py-10">
      <div className="mx-auto max-w-4xl px-6">
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-zinc-900/50 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="text-xl font-semibold text-zinc-50">
              Je volgende offerte is 2 minuten weg.
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Prijzenbibliotheek, klanten-CRM en volledige personalisatie —
              ontdek meer functies.
            </p>
          </div>
          <Link
            href="/#start"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400"
          >
            Mijn eerste offerte maken
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

const trades = [
  { emoji: "🧱", t: "Metselaar", s: "Offertes metselwerk" },
  { emoji: "🎨", t: "Schilder", s: "Offertes schilder- & bekleding" },
  { emoji: "🔧", t: "Loodgieter", s: "Offertes sanitair" },
  { emoji: "⚡", t: "Elektricien", s: "Offertes elektriciteit & domotica" },
  { emoji: "🏠", t: "Dakdekker", s: "Offertes dak & bedekking" },
  { emoji: "🪵", t: "Timmerman", s: "Offertes timmerwerk & hout" },
  { emoji: "🚪", t: "Schrijnwerker", s: "Offertes schrijnwerk & ramen" },
  { emoji: "🔲", t: "Tegelzetter", s: "Offertes tegels & vloeren" },
  { emoji: "🌡️", t: "Verwarmingstechnicus", s: "Offertes verwarming & klimaat" },
  { emoji: "🧊", t: "Gipsplaatser", s: "Offertes gyproc & isolatie" },
  { emoji: "🌿", t: "Tuinaannemer", s: "Offertes groenaanleg" },
  { emoji: "🏗️", t: "Alle vakken", s: "Renovatie & nieuwbouw" },
];

function TradesSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          kicker="Voor alle vakmensen in de bouw"
          title="Jouw vak, jouw AI-offerte"
          desc="Nova kent de eigenheden van elk vak. Wat je activiteit ook is, ze kent je prestaties en je manier van calculeren."
        />

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {trades.map((tr) => (
            <div
              key={tr.t}
              className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 transition-colors hover:border-sky-500/40 hover:bg-zinc-900"
            >
              <div className="text-2xl">{tr.emoji}</div>
              <p className="mt-3 font-semibold text-zinc-50">{tr.t}</p>
              <p className="mt-1 text-xs text-zinc-500">{tr.s}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-zinc-500">
          Metselaars, elektriciens, loodgieters, schilders, dakdekkers… +10.000
          vakmensen gebruiken ArchonPro al voor hun offertes.
        </p>
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
              Maak je eerste offerte met Nova in 2 minuten
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
              14 dagen gratis proberen. Zonder creditcard. Zonder verplichting.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/#start"
                className="group inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400"
              >
                Gratis account aanmaken
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <a
                href="#hoe"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
              >
                Hoe werkt het?
              </a>
            </div>

            <p className="mt-6 text-xs text-zinc-500">
              ✓ 14 dagen gratis · ✓ Zonder verplichting · ✓ Support inbegrepen
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
