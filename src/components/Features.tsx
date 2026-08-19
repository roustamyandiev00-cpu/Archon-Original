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
    <section
      id="features-section"
      className="relative border-b border-white/[0.08] bg-[#030914] py-16 sm:py-20 lg:py-24"
    >
      <div id="features" className="absolute -top-24" aria-hidden />
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-5 border-b border-white/[0.08] pb-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end lg:gap-16 lg:pb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
              Eén centrale werkruimte
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-white sm:text-4xl">
            Alles om tijd te winnen
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Slimme functies die je elke dag tijd besparen — van eerste offerte
            tot betaalde factuur.
          </p>
        </div>

        <div className="mt-8 sm:mt-10">
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/[0.09] bg-[#081320] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.14)] transition-colors hover:border-sky-400/25 hover:bg-[#0a1726] sm:p-6"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-sky-300/20 bg-sky-400/[0.07] text-sky-300 sm:h-11 sm:w-11">
                  <f.icon size={20} strokeWidth={1.7} />
                </div>
                <h3 className="mt-5 text-[15px] font-semibold leading-snug text-slate-100 sm:text-base">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
