import Image from "next/image";

const stats = [
  {
    value: "1 werkruimte",
    label: "Offertes, projecten en facturen blijven met elkaar verbonden",
  },
  {
    value: "Jij beslist",
    label: "AI bereidt voor; niets vertrekt zonder jouw goedkeuring",
  },
  {
    value: "EU-hosting",
    label: "Je bedrijfsdata blijft binnen de Europese Unie",
  },
];

export default function Genius() {
  return (
    <section
      id="resultaten"
      className="relative border-b border-white/[0.08] bg-[#030914] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-5 border-b border-white/[0.08] pb-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end lg:gap-16 lg:pb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
              Resultaten
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.025em] text-white sm:text-4xl">
            Minder administratie, meer afgewerkte projecten
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Minder losse stappen, meer overzicht en menselijke controle op elk
            belangrijk moment.
          </p>
        </div>

        <div className="mt-8 grid overflow-hidden rounded-2xl border border-white/[0.09] bg-[#081320] sm:mt-10 sm:grid-cols-3 sm:divide-x sm:divide-white/[0.08]">
          {stats.map((s) => (
            <div key={s.label} className="border-b border-white/[0.08] p-6 text-center last:border-b-0 sm:border-b-0 sm:p-8">
              <p className="text-2xl font-semibold text-sky-300 sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#081320] p-3 shadow-[0_24px_72px_rgba(0,0,0,0.22)] sm:mt-10 sm:p-5">
          <Image
            src="/ai-workflow-phones.png"
            alt="Van nieuwe lead tot verzonden antwoord: notificatie, AI-voorstel en goedkeuren in drie stappen op je gsm"
            width={2816}
            height={1536}
            className="relative h-auto w-full rounded-xl"
            sizes="(max-width: 768px) 100vw, 1152px"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}
