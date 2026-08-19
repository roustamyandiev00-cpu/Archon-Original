import { FileCheck2, FolderKanban, ReceiptText } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Offerte",
    description:
      "Maak professionele offertes in minuten met je eigen prijzen en sjablonen.",
    icon: FileCheck2,
  },
  {
    number: "02",
    title: "Project",
    description:
      "Plan je werf, volg taken op en communiceer met je team vanuit één overzicht.",
    icon: FolderKanban,
  },
  {
    number: "03",
    title: "Factuur",
    description:
      "Factureer foutloos, volg betalingen op en krijg sneller betaald.",
    icon: ReceiptText,
  },
];

export default function HomepageWorkflow() {
  return (
    <section className="relative border-b border-white/[0.08] bg-[#071526] py-14 sm:py-18 lg:py-20">
      <div className="mx-auto grid max-w-[90rem] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)] lg:gap-16 lg:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
            Van offerte tot betaling
          </p>
          <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.025em] text-white lg:text-[2rem]">
            Eén doorlopende workflow. Minder losse tools, meer marge.
          </h2>
        </div>

        <ol className="grid gap-8 sm:grid-cols-3 sm:gap-5">
          {steps.map((step, index) => (
            <li key={step.title} className="relative border-t border-sky-300/45 pt-6 sm:pt-7">
              <span className="absolute -top-4 left-0 grid h-8 w-8 place-items-center rounded-full border border-sky-400 bg-[#071526] text-[11px] font-semibold text-sky-200">
                {index + 1}
              </span>
              <div className="flex items-center gap-3">
                <step.icon size={20} strokeWidth={1.7} className="text-sky-300" />
                <p className="text-xs font-semibold tracking-[0.12em] text-slate-500">
                  {step.number}
                </p>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
