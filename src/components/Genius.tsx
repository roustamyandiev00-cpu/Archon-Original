import Image from "next/image";

const stats = [
  { value: "5 min", label: "Gemiddeld per offerte i.p.v. 2 uur handwerk" },
  { value: "2× sneller", label: "Betaald dankzij automatische herinneringen" },
  { value: "3 u / week", label: "Bespaarde administratie per week" },
];

export default function Genius() {
  return (
    <section id="resultaten" className="section-tint relative py-14 sm:py-20 lg:py-24">
      <div aria-hidden className="section-edge" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-sky-400">Resultaten</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl lg:text-4xl">
            Minder administratie, meer afgewerkte projecten
          </h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-400 sm:mt-4 sm:text-lg">
            Concrete resultaten van vakmensen die met ArchonPro werken.
          </p>
        </div>

        <div className="section-surface mt-8 grid gap-3 p-2 sm:mt-12 sm:grid-cols-3 sm:gap-5">
          {stats.map((s) => (
            <div key={s.label} className="card-subtle p-5 text-center sm:p-6">
              <p className="text-2xl font-semibold text-gradient sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="relative mt-8 panel-soft p-3 sm:mt-12 sm:p-6">
          <div
            className="pointer-events-none absolute -inset-x-8 -top-12 bottom-0 opacity-50 blur-3xl"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(56,189,248,0.12), transparent 70%)",
            }}
          />
          <Image
            src="/ai-workflow-phones.png"
            alt="Van nieuwe lead tot verzonden antwoord: notificatie, AI-voorstel en goedkeuren in drie stappen op je gsm"
            width={2816}
            height={1536}
            className="relative h-auto w-full [filter:drop-shadow(0_24px_48px_rgba(0,0,0,0.35))]"
            sizes="(max-width: 768px) 100vw, 1152px"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}
