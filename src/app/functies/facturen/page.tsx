import type { Metadata } from "next";
import {
  ArrowRight,
  Sparkles,
  Repeat,
  ShieldCheck,
  Wallet,
  ListChecks,
  Download,
  Check,
  Star,
  FileText,
  Receipt,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Facturen — Van offerte naar factuur in 1 klik | ArchonPro",
  description:
    "Offerte aanvaard? Nova maakt er in seconden een conforme factuur van. Voorschotten, saldo's, opvolging — alles geautomatiseerd. Conform e-facturatie via Peppol.",
};

const faqItems = [
  {
    q: "Is ArchonPro compatibel met e-facturatie?",
    a: "Ja. ArchonPro is conform de verplichtingen rond e-facturatie en verstuurt via Peppol. Je facturen bevatten alle verplichte vermeldingen, een sequentiële nummering en worden gegenereerd in een wettelijk geldig formaat.",
  },
  {
    q: "Hoe zet ik een offerte om in een factuur?",
    a: "Zodra je klant de offerte aanvaardt, klik je op 'Factuur maken'. Nova neemt alle lijnen, bedragen en klantgegevens over en kent automatisch het factuurnummer toe. Je hoeft niets opnieuw in te voeren.",
  },
  {
    q: "Kan ik voorschotfacturen maken?",
    a: "Ja. Je stelt je voorschot in (percentage of vast bedrag) en Nova genereert de bijhorende voorschotfactuur. De saldofactuur wordt daarna automatisch berekend. Je kunt meerdere voorschotten per werf maken.",
  },
  {
    q: "Hoe volg ik de betaling van mijn facturen op?",
    a: "ArchonPro toont de status van elke factuur in realtime: concept, verzonden, in afwachting, betaald. In één oogopslag zie je wat geïnd is en wat nog te innen valt. Een factuur markeer je als betaald met één klik.",
  },
  {
    q: "Kan ik facturen exporteren voor mijn boekhouder?",
    a: "Ja. Je exporteert je facturen als PDF, Excel (.xlsx) of CSV. ArchonPro koppelt ook rechtstreeks met verschillende boekhoud- en bouwsoftware. Bekijk alle integraties.",
  },
];

export default function FacturenPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ConversionSection />
        <EInvoiceSection />
        <DepositSection />
        <TrackingSection />
        <ExportSection />
        <Testimonials />
        <Faq items={faqItems} />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

/* ---------- shared helpers ---------- */

function SectionHeading({
  kicker,
  title,
  desc,
  align = "center",
}: {
  kicker: string;
  title: React.ReactNode;
  desc?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
      <p className="text-sm font-medium text-sky-400">{kicker}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
        {title}
      </h2>
      {desc && <p className="mt-4 text-lg text-zinc-400">{desc}</p>}
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

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-zinc-300">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-500/15 text-sky-400">
        <Check size={12} />
      </span>
      <span className="text-sm">{children}</span>
    </li>
  );
}

function Row({
  k,
  v,
  tone,
}: {
  k: string;
  v: string;
  tone?: "sky" | "emerald";
}) {
  const toneCls =
    tone === "sky"
      ? "text-sky-400"
      : tone === "emerald"
        ? "text-emerald-400"
        : "text-zinc-100";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-sm text-zinc-500">{k}</span>
      <span className={`text-sm font-semibold ${toneCls}`}>{v}</span>
    </div>
  );
}

/* ---------- sections ---------- */

function Hero() {
  return (
    <PageHero
      variant="panel"
      kicker={
        <>
          <ShieldCheck size={13} className="text-emerald-300" /> Conform
          e-facturatie · Peppol
        </>
      }
      title="Van offerte naar factuur in"
      accent="één klik"
      subtitle="Offerte aanvaard? Nova maakt er in seconden een conforme factuur van. Voorschotten, saldo's, herinneringen — alles geautomatiseerd."
      primary={{ label: "Gratis factureren proberen", href: "/#start" }}
      secondary={{ label: "Hoe maak je een factuur?", href: "#hoe" }}
      visual={
        <div>
          <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <Card className="!p-5">
              <div className="flex items-center gap-2 text-zinc-400">
                <FileText size={16} className="text-sky-400" />
                <span className="text-sm">Offerte</span>
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-100">
                Van Dijck
              </p>
              <p className="mt-1 text-xs text-zinc-500">OFF-2026-0042 · € 3.148</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <Check size={12} /> Aanvaard
              </span>
            </Card>

            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-zinc-900 text-sky-400">
              <Repeat size={18} />
            </div>

            <Card className="!p-5">
              <div className="flex items-center gap-2 text-zinc-400">
                <Receipt size={16} className="text-sky-400" />
                <span className="text-sm">Factuur</span>
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-100">
                Van Dijck
              </p>
              <p className="mt-1 text-xs text-zinc-500">F-2026-0087 · € 3.148</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
                <Check size={12} /> Gevalideerd
              </span>
            </Card>
          </div>
          <p className="mt-4 text-center text-sm text-zinc-500">
            Alle lijnen automatisch overgenomen — nul herinvoer.
          </p>
        </div>
      }
    />
  );
}

function ConversionSection() {
  return (
    <section id="hoe" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              kicker="Directe conversie"
              title={
                <>
                  Offerte aanvaard? Factuur klaar in{" "}
                  <span className="text-gradient">1 klik</span>
                </>
              }
              desc="Gedaan met dezelfde info twee keer invoeren. Zodra je klant de offerte aanvaardt, neemt ArchonPro alle lijnen, bedragen en gegevens over voor een conforme factuur in seconden."
            />
            <ul className="mt-8 space-y-3">
              <Bullet>Automatische overname van alle offertelijnen</Bullet>
              <Bullet>Automatische nummering</Bullet>
              <Bullet>Wettelijke vermeldingen en gegevens personaliseerbaar</Bullet>
              <Bullet>Volledige traceerbaarheid offerte → factuur</Bullet>
            </ul>
          </div>

          <Card>
            <div className="flex items-center gap-2 text-zinc-400">
              <Repeat size={16} className="text-sky-400" />
              <span className="text-sm">Conversie offerte → factuur</span>
              <span className="ml-auto text-xs text-zinc-500">In seconden</span>
            </div>
            <div className="mt-5 rounded-2xl border border-white/5 bg-zinc-950/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">
                  Offerte · Renovatie badkamer
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                  Beschikbaar ✓
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">OFF-2026-0042 · € 3.148</p>
            </div>
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 text-sm font-medium text-zinc-950">
              ⚡ Factuur maken
            </button>
            <div className="mt-3 rounded-2xl border border-white/5 bg-zinc-950/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">
                  Factuur · Renovatie badkamer
                </span>
                <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs text-sky-400">
                  Gevalideerd ✓
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">F-2026-0087 · € 3.148</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function EInvoiceSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Card className="order-2 lg:order-1">
            <div className="flex items-center gap-2 text-zinc-400">
              <Receipt size={16} className="text-sky-400" />
              <span className="text-sm">Factuur nr. F-2026-0087</span>
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-400">
                <ShieldCheck size={12} /> Conform
              </span>
            </div>
            <div className="mt-5 rounded-2xl border border-white/5 bg-zinc-950/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-100">
                  Renovatie badkamer
                </span>
                <span className="text-sm font-semibold text-zinc-50">
                  € 3.148
                </span>
              </div>
              <p className="text-xs text-zinc-500">Van Dijck Bouw</p>
              <div className="mt-3 space-y-2 text-sm">
                <Row k="Uitbraak tegels · 35 m²" v="€ 490" />
                <Row k="Plaatsing keramisch 60×60" v="€ 2.100" />
                <Row k="Chape herstellen · 10 m²" v="€ 380" />
                <Row k="Btw 6%" v="€ 178,20" />
                <Row k="Totaal incl. btw" v="€ 3.148,20" tone="sky" />
              </div>
              <div className="mt-4 flex gap-2">
                <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300">
                  PDF
                </span>
                <span className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
                  Markeren als betaald ✓
                </span>
              </div>
            </div>
          </Card>

          <div className="order-1 lg:order-2">
            <SectionHeading
              align="left"
              kicker="E-facturatie"
              title={
                <>
                  Conform de{" "}
                  <span className="text-gradient">elektronische facturatie</span>
                </>
              }
              desc="ArchonPro is compatibel met de verplichtingen rond e-facturatie. Je facturen worden gegenereerd in een conform formaat, met alle verplichte vermeldingen, en verstuurd via Peppol."
            />
            <ul className="mt-8 space-y-3">
              <Bullet>Conform formaat volgens de wettelijke verplichtingen</Bullet>
              <Bullet>Sequentiële en onveranderlijke nummering</Bullet>
              <Bullet>Btw-nummer, btw-vermeldingen, betalingsvoorwaarden</Bullet>
              <Bullet>Geschikt voor zelfstandigen én kmo&apos;s</Bullet>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function DepositSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              kicker="Voorschotten & saldofacturen"
              title={
                <>
                  Beheer voorschotten en saldo&apos;s{" "}
                  <span className="text-gradient">automatisch</span>
                </>
              }
              desc="Stel je voorschotten in — 30%, 50% of het bedrag van je keuze — en maak de bijhorende facturen automatisch aan. De saldofactuur wordt berekend en aangemaakt zodra je het vraagt."
            />
            <ul className="mt-8 space-y-3">
              <Bullet>Voorschotfactuur in percentage of vast bedrag</Bullet>
              <Bullet>Saldofactuur automatisch berekend</Bullet>
              <Bullet>Meerdere voorschotten mogelijk per werf</Bullet>
              <Bullet>Duidelijk zicht op geïnd en nog te innen bedrag</Bullet>
            </ul>
          </div>

          <Card>
            <div className="flex items-center gap-2 text-zinc-400">
              <Wallet size={16} className="text-sky-400" />
              <span className="text-sm">Voorschotten & saldo</span>
              <span className="ml-auto text-xs text-zinc-500">
                Werf Van Dijck · € 3.148
              </span>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-sm text-zinc-200">Voorschot 30%</p>
                  <p className="text-xs text-emerald-400">✓ Geïnd</p>
                </div>
                <span className="text-sm font-semibold text-zinc-50">€ 944</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-sm text-zinc-200">Saldo 70%</p>
                  <p className="text-xs text-zinc-500">⏳ Te innen</p>
                </div>
                <span className="text-sm font-semibold text-zinc-50">
                  € 2.204
                </span>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Inning voortgang</span>
                <span>30%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-[30%] rounded-full bg-gradient-to-r from-sky-400 to-indigo-500" />
              </div>
            </div>
            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-200">
              🧾 Saldofactuur maken
            </button>
          </Card>
        </div>
      </div>
    </section>
  );
}

function TrackingSection() {
  const invoices = [
    { n: "Renovatie badkamer — Van Dijck", nr: "F-2026-0087", a: "€ 3.148", s: "Gevalideerd", tone: "sky" },
    { n: "Keukentegels — Peeters", nr: "F-2026-0088", a: "€ 1.840", s: "Verzonden", tone: "zinc" },
    { n: "Parket plaatsen — SCI Lilas", nr: "F-2026-0089", a: "€ 2.100", s: "Te laat", tone: "rose" },
    { n: "Zolderisolatie — Leroy", nr: "F-2026-0090", a: "€ 950", s: "Concept", tone: "zinc" },
  ];
  const toneMap: Record<string, string> = {
    sky: "bg-sky-500/10 text-sky-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    rose: "bg-rose-500/10 text-rose-400",
    zinc: "bg-white/5 text-zinc-400",
  };
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Card className="order-2 lg:order-1">
            <div className="flex items-center gap-2 text-zinc-400">
              <ListChecks size={16} className="text-sky-400" />
              <span className="text-sm">Facturenopvolging</span>
              <span className="ml-auto text-xs text-zinc-500">
                4 facturen · maart 2026
              </span>
            </div>
            <div className="mt-5 space-y-2.5">
              {invoices.map((iv) => (
                <div
                  key={iv.nr}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-zinc-200">{iv.n}</p>
                    <p className="text-xs text-zinc-500">{iv.nr}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium text-zinc-100">
                      {iv.a}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${toneMap[iv.tone]}`}
                    >
                      {iv.s}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-sm text-zinc-400">
                Totaal te innen deze maand
              </span>
              <span className="text-base font-semibold text-zinc-50">
                € 3.940
              </span>
            </div>
          </Card>

          <div className="order-1 lg:order-2">
            <SectionHeading
              align="left"
              kicker="Facturenopvolging"
              title={
                <>
                  Weet altijd waar elke factuur{" "}
                  <span className="text-gradient">staat</span>
                </>
              }
              desc="ArchonPro geeft je in realtime volledig zicht op al je facturen. Concept, verzonden, betaald — elke status is duidelijk en wordt automatisch bijgewerkt."
            />
            <ul className="mt-8 space-y-3">
              <Bullet>Statussen in realtime: concept, verzonden, betaald</Bullet>
              <Bullet>Totaaloverzicht van al je facturen</Bullet>
              <Bullet>Filteren per klant of per werf</Bullet>
              <Bullet>Volledige historiek van elk document</Bullet>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExportSection() {
  const formats = [
    { icon: "📄", t: "PDF", s: "Professionele lay-out, logo inbegrepen" },
    { icon: "📊", t: "Excel (.xlsx)", s: "Voor je boekhouder" },
    { icon: "📋", t: "CSV", s: "Import boekhoudsoftware" },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              kicker="Export & integraties"
              title={
                <>
                  Heb je al boekhoudsoftware?{" "}
                  <span className="text-gradient">ArchonPro koppelt ermee</span>
                </>
              }
              desc="ArchonPro is compatibel met de belangrijkste boekhoud- en beheersoftware. Behoud je bestaande tools en voeg de kracht van Nova toe — zonder iets opnieuw in te voeren."
            />
            <ul className="mt-8 space-y-3">
              <Bullet>Professionele PDF-export met je logo</Bullet>
              <Bullet>Excel- en CSV-export voor je software-imports</Bullet>
              <Bullet>Directe koppeling met je beheertools</Bullet>
              <Bullet>Automatische archivering van alle documenten</Bullet>
            </ul>
            <a
              href="/functies/integraties"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              Bekijk alle integraties
              <ArrowRight size={14} />
            </a>
          </div>

          <Card>
            <div className="flex items-center gap-2 text-zinc-400">
              <Download size={16} className="text-sky-400" />
              <span className="text-sm">Export & integraties</span>
              <span className="ml-auto text-xs text-zinc-500">F-2026-0087</span>
            </div>
            <div className="mt-5 space-y-2.5">
              {formats.map((f) => (
                <div
                  key={f.t}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{f.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{f.t}</p>
                      <p className="text-xs text-zinc-500">{f.s}</p>
                    </div>
                  </div>
                  <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300">
                    Downloaden
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <p className="text-xs text-zinc-500">Beschikbare integraties</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Billit", "Yuki", "Exact Online", "Teamleader", "Peppol"].map(
                  (i) => (
                    <span
                      key={i}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
                    >
                      {i}
                    </span>
                  )
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    {
      q: "Proficiat met deze app, ze is uitstekend! Eerlijk, ik ben verbaasd — ik win kostbare tijd op mijn offertes en facturen. Echt prachtig, niets op aan te merken.",
      n: "Christophe V.",
      r: "Bedrijfsleider",
      i: "C",
    },
    {
      q: "Ik maak mijn offerte in enkele minuten, en met 1 klik wordt mijn offerte een factuur. Ik ben er weg van, ik herleef!",
      n: "Damien L.",
      r: "Elektricien",
      i: "D",
    },
    {
      q: "Jullie hebben goed werk geleverd met ArchonPro. Alleen de facturatie ontbrak nog — en die is er nu!",
      n: "Johnny",
      r: "Schilder",
      i: "J",
    },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          kicker="Getuigenissen van vakmensen"
          title="Wat ze zeggen over factureren met ArchonPro"
          desc="Vakmensen die opnieuw controle namen over hun facturatie."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {reviews.map((rv) => (
            <Card key={rv.n}>
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-zinc-300">
                &ldquo;{rv.q}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-zinc-950">
                  {rv.i}
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{rv.n}</p>
                  <p className="text-xs text-zinc-500">{rv.r}</p>
                </div>
              </div>
            </Card>
          ))}
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
              Zet je eerste offerte om in een factuur in 30 seconden
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
                href="/functies/ai-metgezel#hoe"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
              >
                Hoe werkt het?
              </a>
            </div>
            <p className="mt-6 text-xs text-zinc-500">
              ✓ 14 dagen gratis · ✓ Zonder verplichting · ✓ Conform e-facturatie
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
