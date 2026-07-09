import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Library,
  Calculator,
  Users,
  FolderKanban,
  Palette,
  Download,
  Check,
  Star,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Schatting — Nova maakt je offertes | ArchonPro",
  description:
    "Nova calculeert, structureert en bereidt je bouwofferte in enkele momenten voor. Prijzenbibliotheek, automatische btw, klanten-CRM en volledige personalisatie.",
};

const faqItems = [
  {
    q: "Kan Nova echt een offerte maken vanuit een spraaknotitie?",
    a: "Ja. Praat over je werken zoals tegen een collega — bouwjargon inbegrepen. Nova transcribeert, begrijpt en genereert in seconden een gestructureerde offerte. Ze past automatisch je werken en prijzen toe.",
  },
  {
    q: "Hoe werkt het importeren van een foto of meetstaat?",
    a: "Voor een foto neem je die in de app of importeer je ze. Nova leest je handgeschreven notities en haalt de werken eruit. Voor een meetstaat importeer je het bestand en neemt Nova de beschrijving post per post over.",
  },
  {
    q: "Worden mijn werken en prijzen automatisch gebruikt?",
    a: "Ja. Je stelt je prijzenbibliotheek één keer in. Nova past ze toe op elke offerte. Je kunt een lijn na generatie altijd nog aanpassen.",
  },
  {
    q: "Is de gegenereerde offerte wettelijk conform?",
    a: "Ja. ArchonPro genereert offertes conform de wettelijke verplichtingen: verplichte vermeldingen, automatische nummering, correcte btw en je ondernemingsgegevens (btw-nummer). Je hoeft niets na te kijken.",
  },
  {
    q: "In welke formaten kan ik een offerte exporteren?",
    a: "PDF, aanpasbare Excel (.xlsx) en CSV. ArchonPro koppelt ook met je bestaande tools en verstuurt via Peppol.",
  },
];

export default function SchattingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AutoQuote />
        <PriceLibrary />
        <VatSection />
        <CrmSection />
        <ProjectSection />
        <CustomizeSection />
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

/* ---------- sections ---------- */

function Hero() {
  return (
    <PageHero
      variant="amber"
      kicker={
        <>
          <Sparkles size={13} className="text-amber-300" /> Offertes · ArchonPro
        </>
      }
      title="Nova maakt je offertes"
      accent="in jouw plaats"
      subtitle="Onze AI-agent Nova calculeert, structureert en bereidt je bouwofferte in enkele momenten voor. Jij hoeft alleen nog te valideren."
      primary={{ label: "Gratis offerte maken", href: "/#start" }}
      secondary={{ label: "Bekijk demo", href: "#demo" }}
      visual={
        <Card>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
              <Sparkles size={16} className="text-sky-400" /> Offerte gegenereerd
              door Nova
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
              Concept ✓
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-zinc-100">
            Renovatie badkamer — Van Dijck
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <QuoteLine desc="Uitbraak bestaande tegels" qty="35 m²" price="€ 490" />
            <QuoteLine
              desc="Plaatsing keramisch 60×60 + epoxyvoegen"
              qty="35 m²"
              price="€ 2.100"
            />
            <QuoteLine desc="Chape herstellen" qty="10 m²" price="€ 380" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-sm text-zinc-400">Totaal excl. btw</span>
            <span className="text-base font-semibold text-zinc-50">€ 2.970</span>
          </div>
        </Card>
      }
    />
  );
}

function QuoteLine({
  desc,
  qty,
  price,
}: {
  desc: string;
  qty: string;
  price: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-zinc-300">{desc}</span>
      <span className="text-xs text-zinc-500">{qty}</span>
      <span className="font-medium text-zinc-100">{price}</span>
    </div>
  );
}

function AutoQuote() {
  return (
    <section id="demo" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              kicker="AI-metgezel voor bouwoffertes"
              title={
                <>
                  Spraak, foto of meetstaat: Nova genereert je offerte{" "}
                  <span className="text-gradient">automatisch</span>
                </>
              }
              desc="Gedaan met handmatig invoeren. Stuur je instructies naar Nova, die ze analyseert en in seconden een gestructureerde offerte genereert."
            />
            <ul className="mt-8 space-y-3">
              <Bullet>Spraaknotitie → gestructureerde offerte in minder dan een minuut</Bullet>
              <Bullet>Foto van handgeschreven notities → automatische extractie van de werken</Bullet>
              <Bullet>Antwoord op meetstaten → getrouwe overname post per post</Bullet>
              <Bullet>Vrije tekst → begrip van het bouwvocabulaire</Bullet>
              <Bullet>Vanaf mobiel, web of WhatsApp, 24/7</Bullet>
            </ul>
          </div>

          <Card>
            <div className="flex items-center gap-2 text-zinc-400">
              <Sparkles size={16} className="text-sky-400" />
              <span className="text-sm">Nova stelt je offerte samen</span>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <QuoteLine desc="Uitbraak bestaande tegels" qty="35 m²" price="€ 490" />
              <QuoteLine desc="Plaatsing keramisch 60×60" qty="35 m²" price="€ 2.100" />
              <QuoteLine desc="Chape herstellen" qty="10 m²" price="€ 380" />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-sm text-zinc-400">Totaal excl. btw</span>
              <span className="text-base font-semibold text-zinc-50">€ 2.970</span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function PriceLibrary() {
  const items = [
    { t: "Plaatsing vloertegels", p: "64 €/m²" },
    { t: "PVC-hoekprofiel 80", p: "16 €/lm" },
    { t: "Badscherm geleverd & geplaatst", p: "216 €/st" },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Card className="order-2 lg:order-1">
            <div className="flex items-center gap-2 text-zinc-400">
              <Library size={16} className="text-sky-400" />
              <span className="text-sm">Prijzenbibliotheek</span>
              <span className="ml-auto text-xs text-zinc-500">47 werken opgeslagen</span>
            </div>
            <div className="mt-5 rounded-full border border-white/10 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-500">
              Zoek een werk…
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Alle", "Tegels", "Gyproc", "Metselwerk", "Schilderwerk"].map(
                (c, i) => (
                  <span
                    key={c}
                    className={`rounded-full px-3 py-1 text-xs ${
                      i === 0
                        ? "bg-sky-500 text-zinc-950"
                        : "border border-white/10 text-zinc-300"
                    }`}
                  >
                    {c}
                  </span>
                )
              )}
            </div>
            <div className="mt-4 space-y-2">
              {items.map((it) => (
                <div
                  key={it.t}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                >
                  <span className="text-sm text-zinc-200">{it.t}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-100">
                      {it.p}
                    </span>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-500/15 text-sky-400">
                      +
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="order-1 lg:order-2">
            <SectionHeading
              align="left"
              kicker="Prijzenbibliotheek & werken"
              title={
                <>
                  Je prijzen altijd{" "}
                  <span className="text-gradient">binnen handbereik</span>
                </>
              }
              desc="Integreer je prijzenbibliotheek in ArchonPro en Nova past ze automatisch toe op elke offerte die ze voor je genereert."
            />
            <ul className="mt-8 space-y-3">
              <Bullet>AI-import van je prijzen uit oude offertes</Bullet>
              <Bullet>Onmiddellijk zoeken in al je werken</Bullet>
              <Bullet>Prijzen aanpasbaar per lijn, ter plekke</Bullet>
              <Bullet>Ontbreekt een prijs? Nova stelt een calculatie voor die je valideert</Bullet>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function VatSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              kicker="Btw & berekeningen automatisch"
              title={
                <>
                  Nova berekent de btw en totalen{" "}
                  <span className="text-gradient">voor jou</span>
                </>
              }
              desc="Kies je btw-tarief volgens het type werken — 6%, 12% of 21% — en Nova doet de rest. Bedragen excl. btw, btw en incl. btw worden automatisch berekend."
            />
            <p className="mt-6 text-sm text-zinc-400">
              Geen rekenfouten meer. Nova past het juiste btw-tarief toe volgens
              de configuratie van je account.
            </p>
          </div>

          <Card>
            <div className="flex items-center gap-2 text-zinc-400">
              <Calculator size={16} className="text-sky-400" />
              <span className="text-sm">Btw & totalen — berekend door Nova</span>
            </div>
            <div className="mt-5">
              <p className="text-sm text-zinc-500">Wat is je standaard btw?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["6%", "12%", "21%"].map((v, i) => (
                  <span
                    key={v}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      i === 0
                        ? "bg-sky-500 text-zinc-950"
                        : "border border-white/10 text-zinc-300"
                    }`}
                  >
                    {v}
                  </span>
                ))}
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300">
                  🇧🇪 België
                </span>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-white/5 bg-zinc-950/60 p-4">
              <p className="text-xs text-zinc-500">Renovatie hoofdverblijf</p>
              <div className="mt-2 space-y-2">
                <Row k="Totaal excl. btw" v="€ 2.970" />
                <Row k="Btw 6%" v="€ 178,20" />
                <Row k="Totaal incl. btw" v="€ 3.148,20" tone="sky" />
              </div>
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

function CrmSection() {
  const clients = [
    { n: "Van Dijck Bouw", loc: "Antwerpen · Pro", d: "7", s: "Actief" },
    { n: "Fam. Peeters", loc: "Gent · Particulier", d: "4", s: "Lopend" },
    { n: "De Smet Sanitair", loc: "Brugge · Pro", d: "12", s: "Actief" },
    { n: "Mevr. Janssens", loc: "Leuven · Particulier", d: "2", s: "Nieuw" },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Card className="order-2 lg:order-1">
            <div className="flex items-center gap-2 text-zinc-400">
              <Users size={16} className="text-sky-400" />
              <span className="text-sm">Mijn klanten</span>
              <span className="ml-auto text-xs text-zinc-500">23 actieve klanten</span>
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-white/5">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-white/5 bg-white/[0.03] px-4 py-2 text-xs text-zinc-500">
                <span>Klant</span>
                <span>Offertes</span>
                <span>Status</span>
              </div>
              {clients.map((c) => (
                <div
                  key={c.n}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {c.n}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{c.loc}</p>
                  </div>
                  <span className="text-sm text-zinc-300">{c.d}</span>
                  <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs text-sky-400">
                    {c.s}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="order-1 lg:order-2">
            <SectionHeading
              align="left"
              kicker="Klantenbeheer — geïntegreerde CRM"
              title={
                <>
                  Al je klanten,{" "}
                  <span className="text-gradient">gecentraliseerd</span>
                </>
              }
              desc="ArchonPro bevat een CRM op maat van vakmensen. Voeg een klant toe in seconden, vind de volledige historiek van zijn offertes en bekijk alle info vanuit één fiche."
            />
            <ul className="mt-8 space-y-3">
              <Bullet>Volledige klantfiche: gegevens, notities, historiek</Bullet>
              <Bullet>Alle offertes en facturen van de klant in één oogopslag</Bullet>
              <Bullet>Snel toevoegen en aanpassen vanaf mobiel</Bullet>
              <Bullet>Particulieren én professionals, allemaal op één plek</Bullet>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              kicker="Projectpagina — werfoverzicht"
              title={
                <>
                  De hele werf op{" "}
                  <span className="text-gradient">één pagina</span>
                </>
              }
              desc="Elke werf heeft zijn eigen pagina in ArchonPro. Je vindt er alles in één oogopslag: de offerte, de facturen, de werffoto's, de bestanden, de notities en de volledige historiek."
            />
            <ul className="mt-8 space-y-3">
              <Bullet>Offertes, facturen en documenten gegroepeerd per werf</Bullet>
              <Bullet>Werffoto&apos;s opgeslagen en chronologisch geordend</Bullet>
              <Bullet>Volledige historiek van alle acties</Bullet>
              <Bullet>Voortgang: lopend, afgewerkt, te factureren</Bullet>
            </ul>
          </div>

          <Card>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-sky-400">
                <FolderKanban size={17} />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  Renovatie badkamer — Van Dijck
                </p>
                <p className="text-xs text-zinc-500">Antwerpen · Lopend</p>
              </div>
            </div>

            <div className="mt-5 flex gap-2 text-xs">
              {["Project", "Facturen", "Bestanden", "Notities"].map((t, i) => (
                <span
                  key={t}
                  className={`rounded-full px-3 py-1 ${
                    i === 0
                      ? "bg-sky-500 text-zinc-950"
                      : "border border-white/10 text-zinc-400"
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniStat k="Getekende offerte" v="€ 3.148" />
              <MiniStat k="Voortgang" v="65%" />
              <MiniStat k="Facturen" v="1 / 2" />
              <MiniStat k="Te innen" v="€ 1.574" />
            </div>

            <div className="mt-4">
              <p className="text-xs text-zinc-500">📷 Werffoto&apos;s (8)</p>
              <div className="mt-2 flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 flex-1 rounded-lg bg-gradient-to-br from-zinc-700/60 to-zinc-800/60"
                  />
                ))}
                <div className="grid h-14 w-14 place-items-center rounded-lg border border-white/10 text-xs text-zinc-400">
                  +5
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <p className="text-xs text-zinc-500">{k}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-50">{v}</p>
    </div>
  );
}

function CustomizeSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Card className="order-2 lg:order-1">
            <div className="flex items-center gap-2 text-zinc-400">
              <Palette size={16} className="text-sky-400" />
              <span className="text-sm">Personalisatie van de offerte</span>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs text-zinc-500">Hoofdkleur</p>
                <div className="mt-2 flex gap-2">
                  {["#0ea5e9", "#6366f1", "#10b981", "#f43f5e", "#f59e0b"].map(
                    (c, i) => (
                      <span
                        key={c}
                        className={`h-7 w-7 rounded-full ${i === 0 ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""}`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-zinc-950">
                  A
                </span>
                <span className="text-sm text-zinc-300">Bedrijfslogo</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-4">
                <p className="text-xs text-zinc-500">Betalingsvoorwaarden</p>
                <p className="mt-1 text-sm text-zinc-300">
                  Voorschot 30% bij bestelling. Saldo bij oplevering der werken.
                </p>
              </div>
            </div>
          </Card>

          <div className="order-1 lg:order-2">
            <SectionHeading
              align="left"
              kicker="100% personaliseerbare offertes"
              title={
                <>
                  Je offertes in jouw huisstijl,{" "}
                  <span className="text-gradient">geen generieke template</span>
                </>
              }
              desc="Personaliseer je offertes in twee klikken met een bestaand model, of neem de tijd om extra elementen toe te voegen."
            />
            <ul className="mt-8 space-y-3">
              <Bullet>Logo en kleuren van je bedrijf</Bullet>
              <Bullet>Gepersonaliseerde hoofding en voettekst</Bullet>
              <Bullet>Opgeslagen betalingsvoorwaarden</Bullet>
              <Bullet>Automatische wettelijke vermeldingen</Bullet>
              <Bullet>Automatische en conforme nummering</Bullet>
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
    { icon: "📊", t: "Excel (.xlsx)", s: "Aanpasbaar, alle lijnen" },
    { icon: "📋", t: "CSV", s: "Import boekhouding & ERP" },
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
                  Exporteer je offerte{" "}
                  <span className="text-gradient">zoals jij wil</span>
                </>
              }
              desc="Zodra je offerte klaar is in ArchonPro, exporteer je ze in het formaat dat bij je past. PDF om te delen, aanpasbare Excel voor je interne berekeningen, CSV voor je boekhouding."
            />
            <ul className="mt-8 space-y-3">
              <Bullet>Professionele PDF-export in jouw huisstijl</Bullet>
              <Bullet>Excel-export (.xlsx) — aanpasbaar en klaar voor gebruik</Bullet>
              <Bullet>CSV-export voor je boekhouding</Bullet>
              <Bullet>Verstuur elektronisch via Peppol</Bullet>
            </ul>
          </div>

          <Card>
            <div className="flex items-center gap-2 text-zinc-400">
              <Download size={16} className="text-sky-400" />
              <span className="text-sm">Export & koppelingen</span>
              <span className="ml-auto text-xs text-zinc-500">
                OFF-2026-0042 · € 3.148
              </span>
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
      q: "Uitstekende service, ik raad ArchonPro echt aan. Het maakt mijn dagelijkse werk veel eenvoudiger.",
      n: "Georges",
      r: "Aannemer alle vakken",
      i: "G",
    },
    {
      q: "Heel mooie presentatie, super intuïtief! Bedankt voor deze geweldige AI, ze helpt enorm!",
      n: "Isabelle",
      r: "Binnenrenovatie",
      i: "I",
    },
    {
      q: "De snelheid van de app is gewoon ongelooflijk! Ze bespaart me een pak tijd. Ik gebruik ze met trots.",
      n: "Mickael",
      r: "Binnenrenovatie",
      i: "M",
    },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          kicker="Getuigenissen van vakmensen"
          title="Wat Nova voor hen doet"
          desc="Vakmensen uit alle beroepen winnen elke week uren dankzij Nova, de AI van ArchonPro."
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
              Nova maakt je eerste offerte in minder dan 2 minuten
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
                href="/functies/ai-metgezel#hoe"
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
