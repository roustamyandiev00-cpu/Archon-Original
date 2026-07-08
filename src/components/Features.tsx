import {
  BarChart3,
  Smartphone,
  FileCheck,
  Command,
  Plug,
  BellRing,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Inzicht in één oogopslag",
    desc: "Al je offertes, projecten en omzet op één dashboard. Zie meteen wat openstaat en wat er vandaag moet gebeuren.",
  },
  {
    icon: Smartphone,
    title: "Werkt op de werf",
    desc: "Volledige controle onderweg. Maak een offerte terwijl je nog op de werf staat, gewoon vanaf je gsm.",
  },
  {
    icon: FileCheck,
    title: "Offerte → factuur in één klik",
    desc: "Goedgekeurd? Zet je offerte direct om in een conforme factuur, klaar voor Peppol.",
  },
  {
    icon: BellRing,
    title: "Automatische herinneringen",
    desc: "ArchonPro volgt onbetaalde facturen op en stuurt op tijd een nette herinnering. Sneller betaald, zonder gedoe.",
  },
  {
    icon: Plug,
    title: "Koppelt met je tools",
    desc: "Van e-facturatie via Peppol tot je agenda en betaalproviders — ArchonPro sluit aan op je bestaande workflow.",
  },
  {
    icon: Command,
    title: "Jij houdt de controle",
    desc: "Bliksemsnel werken met sneltoetsen. Alles bereikbaar met ⌘K. Donkere modus. Gemaakt om uit je weg te blijven.",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-sky-400">Alles op één plek</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Alles wat je nodig hebt. Niets wat je niet nodig hebt.
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Van eerste aanvraag tot betaalde factuur — beheer je hele bedrijf in
            één werkruimte die aanvoelt als een fluitje van een cent.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-colors hover:border-sky-500/40 hover:bg-zinc-900"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-400 ring-1 ring-inset ring-white/10">
                <f.icon size={20} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-50">
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
