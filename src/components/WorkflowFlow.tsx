"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";

const workflow = [
  {
    step: "1",
    title: "Klant komt binnen",
    desc: "Contact, aanvraag, notities en documenten op één plek.",
  },
  {
    step: "2",
    title: "Offerte maken",
    desc: "Professionele PDF, duidelijke prijzen en slimme tekstsuggesties.",
  },
  {
    step: "3",
    title: "Opvolgen",
    desc: "Herinneringen, status en automatische opvolging zonder chaos.",
  },
  {
    step: "4",
    title: "Project uitvoeren",
    desc: "Taken, foto's, documenten, planning en teamcommunicatie.",
  },
  {
    step: "5",
    title: "Factureren",
    desc: "Factuur, betaalstatus en klantcommunicatie netjes bewaard.",
  },
];

function FlowArrow({ vertical = false }: { vertical?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center text-sky-500/70 ${
        vertical ? "py-1" : "px-1 lg:px-2"
      }`}
      aria-hidden
    >
      <span className="relative flex items-center justify-center">
        <span className="absolute h-8 w-8 animate-ping rounded-full bg-sky-500/10" />
        {vertical ? (
          <ChevronRight
            size={22}
            className="rotate-90 animate-pulse text-sky-400"
          />
        ) : (
          <ArrowRight size={22} className="animate-pulse text-sky-400" />
        )}
      </span>
    </div>
  );
}

export default function WorkflowFlow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % workflow.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="panel-soft mt-20 p-6 sm:p-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-sky-400 sm:text-base">
          Van aanvraag tot betaald project
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl lg:text-4xl">
          Eén centrale cockpit, geen losse administratie-tools
        </h3>
      </div>

      {/* Desktop: horizontal flow */}
      <div className="mt-12 hidden items-stretch lg:flex">
        {workflow.map((w, i) => (
          <div key={w.step} className="flex min-w-0 flex-1 items-stretch">
            <button
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className={`group relative flex w-full flex-col rounded-2xl p-5 text-left transition-all duration-500 ${
                active === i
                  ? "scale-[1.03] border border-sky-500/30 bg-sky-500/8 shadow-lg shadow-sky-500/8"
                  : "card-subtle hover:border-white/10"
              }`}
            >
              <span
                className={`grid h-11 w-11 place-items-center rounded-xl text-base font-semibold ring-1 ring-inset transition-colors duration-500 ${
                  active === i
                    ? "bg-gradient-to-br from-sky-500 to-cyan-400 text-zinc-950 ring-sky-400/30"
                    : "bg-gradient-to-br from-sky-500/25 to-indigo-500/20 text-sky-300 ring-white/10"
                }`}
              >
                {w.step}
              </span>
              <h4 className="mt-4 text-base font-semibold text-zinc-50 sm:text-lg">
                {w.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
                {w.desc}
              </p>
              {active === i && (
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-sky-400">
                  Volgende stap
                  <ArrowRight size={14} className="animate-pulse" />
                </span>
              )}
            </button>
            {i < workflow.length - 1 && <FlowArrow />}
          </div>
        ))}
      </div>

      {/* Mobile / tablet: vertical flow */}
      <div className="mt-10 space-y-0 lg:hidden">
        {workflow.map((w, i) => (
          <div key={w.step}>
            <button
              type="button"
              onClick={() => setActive(i)}
              className={`w-full rounded-2xl p-5 text-left transition-all duration-500 ${
                active === i
                  ? "border border-sky-500/30 bg-sky-500/8 shadow-lg shadow-sky-500/8"
                  : "card-subtle"
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-base font-semibold ring-1 ring-inset ${
                    active === i
                      ? "bg-gradient-to-br from-sky-500 to-cyan-400 text-zinc-950 ring-sky-400/30"
                      : "bg-gradient-to-br from-sky-500/25 to-indigo-500/20 text-sky-300 ring-white/10"
                  }`}
                >
                  {w.step}
                </span>
                <div>
                  <h4 className="text-lg font-semibold text-zinc-50">
                    {w.title}
                  </h4>
                  <p className="mt-1.5 text-base leading-relaxed text-zinc-400">
                    {w.desc}
                  </p>
                </div>
              </div>
            </button>
            {i < workflow.length - 1 && <FlowArrow vertical />}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-10 hidden lg:block">
        <div className="flex h-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-700 ease-out"
            style={{ width: `${((active + 1) / workflow.length) * 100}%` }}
          />
        </div>
        <p className="mt-3 text-center text-sm text-zinc-500">
          Stap {active + 1} van {workflow.length} — klik of hover om de flow te
          verkennen
        </p>
      </div>
    </div>
  );
}
