import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Globe2,
  Link2,
  Radio,
  ScrollText,
  ShieldCheck,
  Zap,
  FileCode2,
  Webhook,
  Mail,
  Server,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Peppol & E-facturatie — Verplicht in België sinds 2026 | ArchonPro",
  description:
    "Verstuur en ontvang e-facturen via het Peppol-netwerk. ArchonPro koppelt met het Billit Access Point — UBL BIS Billing 3.0, Belgische kopersreferentie en Peppol First.",
};

const faqItems = [
  {
    q: "Wat is e-facturatie?",
    a: "E-facturatie is de uitwisseling van facturen in een gestructureerd elektronisch formaat (XML/UBL), niet louter een PDF of scan. Met de juiste software worden gegevens automatisch ingelezen — zonder handmatig overtypen.",
  },
  {
    q: "Wat is Peppol?",
    a: "Peppol is een internationaal netwerk voor het veilige versturen van zakelijke documenten tussen bedrijven. Documenten moeten voldoen aan vaste standaarden (EN16931 / BIS Billing 3.0). In België gebruik je meestal je KBO- of btw-nummer als Peppol-identificatie.",
  },
  {
    q: "Is Peppol verplicht in België?",
    a: "Sinds 1 januari 2026 is e-facturatie via Peppol verplicht voor Belgische B2B-transacties. Eerder gold dit al voor facturatie aan de overheid (B2G). ArchonPro helpt je conform te blijven met UBL-generatie, validatie en verzending.",
  },
  {
    q: "Hoe koppel ik ArchonPro met Peppol?",
    a: "Ga naar Dashboard → Integraties → Peppol, kies Billit (aanbevolen voor België) of Storecove als access point, en vul je API-gegevens in. ArchonPro genereert de UBL en verstuurt die via het access point naar je klant op het Peppol-netwerk.",
  },
  {
    q: "Wat is een Peppol-ID?",
    a: "Een Peppol-ID identificeert je bedrijf op het netwerk, bv. 0208:0123456789 (KBO) of 9925:BE0123456789 (btw). Zo weet je zeker met wie je facturen uitwisselt. ArchonPro leidt dit af uit je bedrijfsgegevens of je vult het handmatig in.",
  },
  {
    q: "Kan ik ook e-facturen ontvangen?",
    a: "Ja. Met Billit als access point synchroniseert ArchonPro inkomende leveranciersfacturen naar je Peppol-inbox in het dashboard. Uitgaande facturen verstuur je rechtstreeks vanuit een factuur.",
  },
  {
    q: "Wat als mijn klant niet op Peppol staat?",
    a: "ArchonPro controleert of een ontvanger bereikbaar is via Peppol (Peppol First). Is dat niet het geval, dan kun je nog steeds een PDF mailen of de UBL downloaden voor handmatige verwerking.",
  },
];

const peppolRegions = [
  {
    name: "Europa",
    countries: [
      "België",
      "Nederland",
      "Luxemburg",
      "Duitsland",
      "Frankrijk",
      "Italië",
      "Spanje",
      "Polen",
      "Roemenië",
      "Oostenrijk",
      "Zweden",
      "Denemarken",
      "Finland",
      "Noorwegen",
      "Verenigd Koninkrijk",
      "Zwitserland",
      "Hongarije",
      "Kroatië",
      "Slovenië",
      "Bulgarije",
      "Estland",
      "Litouwen",
      "Albanië",
    ],
  },
  {
    name: "Azië & Midden-Oosten",
    countries: [
      "Singapore",
      "Maleisië",
      "Taiwan",
      "India",
      "Japan",
      "Koeweit",
      "Qatar",
      "Saoudi-Arabië",
      "VAE",
    ],
  },
  {
    name: "Oceanië",
    countries: ["Australië", "Nieuw-Zeeland"],
  },
  {
    name: "Noord-Amerika",
    countries: ["Canada", "Mexico", "Verenigde Staten"],
  },
];

const integrationOptions = [
  {
    icon: Zap,
    title: "Synchroon via API",
    desc: "ArchonPro genereert UBL en verstuurt rechtstreeks via het Billit Access Point (v1/peppol/sendxml). Status en fouten komen terug in je factuuroverzicht.",
    tags: ["UBL", "Billit API", "Realtime"],
  },
  {
    icon: Webhook,
    title: "Status & inbox",
    desc: "Ontvang leveranciersfacturen via de Billit-inbox en volg verzendstatussen. Ideaal voor volledige e-facturatie-flow zonder platform te wisselen.",
    tags: ["Inbox sync", "Leveranciers", "Auditlog"],
  },
  {
    icon: FileCode2,
    title: "UBL-download",
    desc: "Werk je met een ander access point of boekhouder? Download conforme UBL-XML per factuur en upload die bij je provider.",
    tags: ["Handmatig", "Elk access point", "EN16931"],
  },
];

export default function PeppolPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AccessSection />
        <WhySection />
        <IntegrationSection />
        <CountriesSection />
        <BillitPartnerSection />
        <Faq items={faqItems} />
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
          <Radio size={13} className="text-emerald-400" /> Peppol &amp; e-facturatie
        </>
      }
      title="Verstuur e-facturen via"
      accent="het Peppol-netwerk"
      subtitle="Conform Belgische wetgeving sinds 2026. ArchonPro genereert UBL BIS Billing 3.0, valideert verplichte velden en verstuurt via het Billit Peppol Access Point — zonder je CRM te verlaten."
      primary={{ label: "Start 14 dagen gratis", href: "/register" }}
      secondary={{ label: "Peppol instellen", href: "/dashboard/instellingen?tab=integraties" }}
      visual={
        <div className="rounded-3xl border border-emerald-500/20 bg-zinc-900/60 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-400">
              Live Peppol-check
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              BIS 3.0
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <PeppolRow label="Leverancier" value="0208:0123456789" ok />
            <PeppolRow label="Klant (BTW)" value="9925:BE0987654321" ok />
            <PeppolRow label="Kopersreferentie BT-10" value="OV-2026-089" ok />
            <PeppolRow label="Gestructureerde mededeling" value="+++123/4567/89012+++" ok />
          </div>
          <div className="mt-5 flex gap-2">
            <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300">
              UBL download
            </span>
            <span className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-zinc-950">
              Verstuur via Peppol
            </span>
          </div>
        </div>
      }
    />
  );
}

function PeppolRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-zinc-950/50 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="truncate font-mono text-xs text-zinc-200">{value}</p>
      </div>
      {ok && <Check size={14} className="shrink-0 text-emerald-400" />}
    </div>
  );
}

function AccessSection() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          kicker="Access point"
          title={
            <>
              Twee manieren om op Peppol aan te sluiten
            </>
          }
          desc="Net als bij Billit kun je e-facturatie via een platform gebruiken, of je eigen software (ArchonPro) koppelen aan een Peppol Access Point."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <Card>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-500/15 text-sky-400">
              <ScrollText size={20} />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-zinc-50">
              Via ArchonPro + access point
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Maak facturen in ArchonPro, valideer Peppol-vereisten en verstuur
              via Billit of Storecove. Ontvang inkomende e-facturen in je
              dashboard-inbox.
            </p>
            <ul className="mt-5 space-y-2">
              <Bullet>UBL-generatie EN16931 / BIS Billing 3.0</Bullet>
              <Bullet>Belgische kopersreferentie &amp; gestructureerde mededeling</Bullet>
              <Bullet>Verbindingstest in Integraties</Bullet>
            </ul>
            <Link
              href="/dashboard/instellingen?tab=integraties"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              Peppol koppelen <ArrowRight size={14} />
            </Link>
          </Card>
          <Card>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Link2 size={20} />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-zinc-50">
              Billit Peppol Access Point
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Billit is een Belgisch Peppol Access Point met dekking in tientallen
              landen. ArchonPro gebruikt de Billit API om UBL veilig op het netwerk
              te plaatsen — conform de{" "}
              <a
                href="https://www.billit.eu/nl-be/peppol-e-invoicing-access-point/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline hover:text-emerald-300"
              >
                Billit Peppol-documentatie
              </a>
              .
            </p>
            <ul className="mt-5 space-y-2">
              <Bullet>Party ID + API-sleutel uit MyBillit</Bullet>
              <Bullet>Sandbox voor testen vóór productie</Bullet>
              <Bullet>Peppol First: check of ontvanger bereikbaar is</Bullet>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  const items = [
    {
      icon: ShieldCheck,
      title: "Veilig & geverifieerd",
      desc: "Iedere deelnemer op Peppol is geïdentificeerd via KBO of btw. Minder risico op factuurfraude.",
    },
    {
      icon: Zap,
      title: "Minder administratie",
      desc: "Geen copy-paste uit PDF's. Factuurgegevens stromen automatisch door naar boekhouding en opvolging.",
    },
    {
      icon: Globe2,
      title: "Internationaal netwerk",
      desc: "Peppol werkt in heel Europa en steeds meer landen wereldwijd — ideaal voor grensoverschrijdende B2B.",
    },
  ];

  return (
    <section className="relative border-y border-white/5 bg-zinc-950/40 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          kicker="Waarom Peppol"
          title="Verplicht in België. Voordelig voor elk bouwbedrijf."
          desc="Sinds 1 januari 2026 moeten Belgische bedrijven onderling e-factureren via Peppol. ArchonPro maakt die overstap haalbaar zonder je bestaande workflow te breken."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {items.map((item) => (
            <Card key={item.title}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-sky-400">
                <item.icon size={18} />
              </span>
              <h3 className="mt-4 font-semibold text-zinc-50">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{item.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function IntegrationSection() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          kicker="Koppeling"
          title="Hoe ArchonPro met het Access Point werkt"
          desc="Geïnspireerd op de drie koppelopties van Billit — ArchonPro implementeert de synchrone API-route voor UBL-verzending en inbox-sync."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {integrationOptions.map((opt) => (
            <Card key={opt.title}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300">
                <opt.icon size={18} />
              </span>
              <h3 className="mt-4 font-semibold text-zinc-50">{opt.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{opt.desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {opt.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-zinc-500">
          Meer technische details? Zie de{" "}
          <a
            href="https://docs.billit.be/docs/send-ubl-to-peppol-1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 underline hover:text-sky-300"
          >
            Billit API-documentatie
          </a>{" "}
          en{" "}
          <a
            href="https://www.billit.eu/nl-be/peppol-e-invoicing-access-point/koppel-jouw-software-met-het-billit-peppol-access-point/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 underline hover:text-sky-300"
          >
            koppelgids voor software
          </a>
          .
        </p>
      </div>
    </section>
  );
}

function CountriesSection() {
  return (
    <section id="landen" className="relative border-t border-white/5 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          kicker="Landenlijst"
          title="Peppol en e-invoicing wereldwijd"
          desc="Overzicht van regio's waar Peppol en aanverwante e-invoicingnetwerken actief zijn — gebaseerd op de internationale Billit-landenlijst."
        />
        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          {peppolRegions.map((region) => (
            <Card key={region.name}>
              <div className="flex items-center gap-2">
                <Globe2 size={16} className="text-sky-400" />
                <h3 className="font-semibold text-zinc-50">{region.name}</h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {region.countries.map((c) => (
                  <span
                    key={c}
                    className={`rounded-lg border px-2.5 py-1 text-xs ${
                      c === "België"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-white/8 bg-white/[0.03] text-zinc-400"
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-zinc-600">
          Volledige lijst en land-specifieke regels:{" "}
          <a
            href="https://www.billit.eu/nl-be/peppol-e-invoicing-access-point/peppol-en-e-invoicing-landenlijst/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 underline hover:text-zinc-400"
          >
            Billit Peppol-landenlijst
          </a>
        </p>
      </div>
    </section>
  );
}

function BillitPartnerSection() {
  const steps = [
    {
      icon: Server,
      title: "Billit-account",
      desc: "Maak een account op MyBillit en registreer je bedrijf op Peppol (gratis eerste periode).",
    },
    {
      icon: Mail,
      title: "API-gegevens",
      desc: "Haal Party ID en API-sleutel op in MyBillit → Instellingen → API.",
    },
    {
      icon: Radio,
      title: "Koppel in ArchonPro",
      desc: "Integraties → Peppol → Billit. Test de verbinding en verstuur je eerste e-factuur.",
    },
  ];

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-sky-500/[0.04] p-8 sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            In 3 stappen live op Peppol
          </h2>
          <p className="mt-3 max-w-xl text-zinc-400">
            ArchonPro is gebouwd voor Belgische bouw-KMO&apos;s. Billit levert het
            access point — jij houdt je facturatie in één vertrouwde omgeving.
          </p>
          <ol className="mt-8 space-y-4">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-2xl border border-white/8 bg-zinc-950/40 p-4"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-sm font-bold text-zinc-950">
                  {i + 1}
                </span>
                <div>
                  <p className="flex items-center gap-2 font-medium text-zinc-100">
                    <step.icon size={15} className="text-emerald-400" />
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              Start gratis proef
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/dashboard/e-facturen"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
            >
              E-facturen dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-50">
          Klaar voor conforme e-facturatie?
        </h2>
        <p className="mt-4 text-lg text-zinc-400">
          14 dagen gratis. Geen creditcard. Belgische support.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-8 py-3.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400"
          >
            Gratis starten
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/functies/facturen"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-8 py-3.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
          >
            Facturatie-module
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  kicker,
  title,
  desc,
}: {
  kicker: string;
  title: React.ReactNode;
  desc?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium text-sky-400">{kicker}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
        {title}
      </h2>
      {desc && <p className="mt-4 text-lg text-zinc-400">{desc}</p>}
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
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
        <Check size={12} />
      </span>
      <span className="text-sm">{children}</span>
    </li>
  );
}
