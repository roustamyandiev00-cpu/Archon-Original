import {
  BarChart3,
  Smartphone,
  Handshake,
  Network,
  LayoutGrid,
  Palette,
  Plug,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Helder zicht op je financiën",
    desc: "Zie meteen wie nog moet betalen en wat er binnenkomt. Openstaande facturen, pipeline en cashflow op één overzicht — altijd actueel.",
  },
  {
    icon: Smartphone,
    title: "Onderweg geregeld",
    desc: "Offerte opstellen op de werf of een klant opvolgen vanaf je gsm? Je administratie zit in je broekzak, waar je ook bent.",
  },
  {
    icon: Handshake,
    title: "Werk vlot samen met je accountant",
    desc: "Deel je administratie in één klik. Jij factureert, je boekhouder doet de rest. Minder mails, meer efficiëntie.",
  },
  {
    icon: Network,
    title: "Peppol Access Point",
    desc: "Verzend en ontvang facturen via Peppol, het officiële Europese netwerk. Conform Belgische e-facturatie.",
  },
  {
    icon: LayoutGrid,
    title: "Hou alles bij op één plaats",
    desc: "Klanten, offertes, projecten en taken op een centrale plek. Met één klik zet je alles op je factuur.",
  },
  {
    icon: Palette,
    title: "Factureren in je eigen stijl",
    desc: "Maak offertes en facturen die professioneel ogen — volledig in je huisstijl met logo, kleuren en templates.",
  },
  {
    icon: Plug,
    title: "Naadloze integraties",
    desc: "Koppel ArchonPro met Slack, Google Calendar, boekhoudpakketten en bouwsoftware. Alles werkt samen.",
  },
  {
    icon: ShieldCheck,
    title: "Jouw data: altijd veilig",
    desc: "Je gegevens blijven van jou. EU-hosting, GDPR-compliant en beveiligd — je administratie is veilig bewaard.",
  },
];

export default function Features() {
  return (
    <section id="features-section" className="section-tint relative py-24">
      <div id="features" className="absolute -top-24" aria-hidden />
      <div aria-hidden className="section-edge" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-sky-400">Functies</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Alles om tijd te winnen
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Slimme functies die je elke dag tijd besparen — van eerste offerte
            tot betaalde factuur.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card-subtle group p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.04] text-sky-400 ring-1 ring-inset ring-white/10">
                <f.icon size={20} />
              </div>
              <h3 className="mt-5 text-base font-semibold leading-snug text-zinc-50">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
