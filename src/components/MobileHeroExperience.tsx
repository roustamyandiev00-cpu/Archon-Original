"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileCheck2,
  FileText,
  FolderKanban,
  Play,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FastLink } from "@/components/FastLink";

const workflow = [
  {
    label: "Offerte",
    detail: "Sneller klaar",
    icon: FileText,
    tone: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  },
  {
    label: "Project",
    detail: "Planning op koers",
    icon: FolderKanban,
    tone: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  },
  {
    label: "Factuur",
    detail: "Opvolging geregeld",
    icon: ReceiptText,
    tone: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  },
] as const;

const pages = [
  {
    id: "offertes",
    label: "Offertes",
    icon: FileCheck2,
    eyebrow: "3 offertes in opvolging",
    title: "Dakwerken Peeters",
    detail: "Klaar voor controle",
    status: "Vandaag",
    href: "/dashboard/offertes",
    accent: "text-sky-300",
    iconTone: "border-sky-400/25 bg-sky-400/10 text-sky-300",
    glow: "from-sky-500/20",
  },
  {
    id: "projecten",
    label: "Projecten",
    icon: FolderKanban,
    eyebrow: "5 projecten in uitvoering",
    title: "Renovatie Mechelen",
    detail: "Planning bijgewerkt",
    status: "Op schema",
    href: "/dashboard/offertes/projecten",
    accent: "text-violet-300",
    iconTone: "border-violet-400/25 bg-violet-400/10 text-violet-300",
    glow: "from-violet-500/20",
  },
  {
    id: "facturen",
    label: "Facturen",
    icon: ReceiptText,
    eyebrow: "2 facturen vragen aandacht",
    title: "Factuur Peeters",
    detail: "Herinnering staat klaar",
    status: "Actie nodig",
    href: "/dashboard/facturen",
    accent: "text-emerald-300",
    iconTone: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    glow: "from-emerald-500/20",
  },
  {
    id: "ai-agents",
    label: "AI-agents",
    icon: Bot,
    eyebrow: "4 voorstellen wachten op jou",
    title: "Lara · Offertes",
    detail: "Goedkeuring vereist",
    status: "Voorstel klaar",
    href: "/dashboard/ai-agents",
    accent: "text-orange-300",
    iconTone: "border-orange-400/25 bg-orange-400/10 text-orange-300",
    glow: "from-orange-500/20",
  },
] as const;

export default function MobileHeroExperience() {
  const [activePage, setActivePage] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const selectPage = (index: number) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    setActivePage(index);
    carousel.scrollTo({
      left: carousel.clientWidth * index,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  const handleScroll = () => {
    const carousel = carouselRef.current;
    if (!carousel || carousel.clientWidth === 0) return;

    setActivePage(
      Math.min(
        pages.length - 1,
        Math.max(0, Math.round(carousel.scrollLeft / carousel.clientWidth)),
      ),
    );
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + pages.length) % pages.length;
    selectPage(nextIndex);
    document
      .getElementById("mobile-hero-tab-" + pages[nextIndex].id)
      ?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-10 pt-[calc(4.75rem+env(safe-area-inset-top))] sm:px-6 sm:pt-[calc(5.5rem+env(safe-area-inset-top))]">
      <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300">
        <Sparkles size={12} className="text-sky-400" />
        Gebouwd voor bouwbedrijven in België
      </div>

      <h1 className="mt-4 max-w-[20rem] text-balance text-[2.25rem] font-bold leading-[1.04] tracking-[-0.045em] text-white min-[390px]:text-[2.5rem]">
        Van offerte tot factuur.{" "}
        <span className="text-sky-400">Alles onder controle.</span>
      </h1>

      <p className="mt-4 max-w-[22rem] text-[15px] leading-6 text-slate-300/75">
        Eén rustige werkplek voor je administratie, projecten en slimme
        opvolging.
      </p>

      <div className="mt-6 grid gap-2" aria-label="Werkstroom">
        {workflow.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#07111f]/80 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] backdrop-blur-sm"
            >
              <span
                className={[
                  "grid h-8 w-8 shrink-0 place-items-center rounded-xl border",
                  item.tone,
                ].join(" ")}
              >
                <Icon size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-white">
                  {item.label}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {item.detail}
                </span>
              </span>
              {index < workflow.length - 1 ? (
                <ArrowRight size={15} className="text-sky-400/65" />
              ) : (
                <CheckCircle2 size={15} className="text-emerald-400/80" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-[1fr_auto]">
        <FastLink
          href="/register"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_48px_-18px_rgba(37,99,235,0.9)] hover:bg-blue-500"
        >
          Start 14 dagen gratis
          <ArrowRight size={16} />
        </FastLink>
        <FastLink
          href="/dashboard/voorbeeld"
          aria-label="Bekijk demo"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-[#07111f]/80 px-4 text-sm font-semibold text-zinc-100 hover:border-sky-300/50 hover:bg-white/[0.06]"
        >
          <Play size={15} className="fill-current text-sky-400" />
          <span className="min-[360px]:sr-only min-[405px]:not-sr-only">
            Bekijk demo
          </span>
        </FastLink>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
        <ShieldCheck size={13} className="text-sky-400" />
        Geen creditcard · klaar in 2 minuten
      </div>

      <section
        className="mt-8 overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#050b14]/95 shadow-[0_30px_90px_-42px_rgba(14,165,233,0.8)]"
        aria-labelledby="mobile-command-center-title"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
              ArchonPro
            </p>
            <h2
              id="mobile-command-center-title"
              className="mt-0.5 text-sm font-semibold text-white"
            >
              Command Center
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {pages.map((page, index) => {
            const Icon = page.icon;
            return (
              <article
                key={page.id}
                id={"mobile-hero-panel-" + page.id}
                role="tabpanel"
                aria-labelledby={"mobile-hero-tab-" + page.id}
                aria-hidden={activePage !== index}
                className="relative min-w-full snap-center overflow-hidden px-4 py-4"
              >
                <div
                  aria-hidden
                  className={[
                    "pointer-events-none absolute inset-x-8 top-0 h-24 bg-gradient-to-b to-transparent blur-2xl",
                    page.glow,
                  ].join(" ")}
                />
                <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={[
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl border",
                        page.iconTone,
                      ].join(" ")}
                    >
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={[
                          "text-[11px] font-medium",
                          page.accent,
                        ].join(" ")}
                      >
                        {page.eyebrow}
                      </p>
                      <h3 className="mt-1 truncate text-base font-semibold text-white">
                        {page.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        {page.detail}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {page.status}
                    </span>
                    <FastLink
                      href={page.href}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-[11px] font-semibold text-white hover:border-sky-300/35 hover:bg-white/[0.08]"
                    >
                      Openen
                      <ArrowRight size={13} />
                    </FastLink>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex justify-center gap-1.5 pb-3" aria-hidden>
          {pages.map((page, index) => (
            <span
              key={page.id}
              className={[
                "h-1.5 rounded-full transition-[width,background-color] duration-200",
                activePage === index
                  ? "w-5 bg-sky-400"
                  : "w-1.5 bg-white/20",
              ].join(" ")}
            />
          ))}
        </div>

        <div
          role="tablist"
          aria-label="Command Center pagina's"
          className="grid grid-cols-4 border-t border-white/[0.07] bg-[#030811] p-1.5"
        >
          {pages.map((page, index) => {
            const Icon = page.icon;
            const selected = activePage === index;
            return (
              <button
                key={page.id}
                id={"mobile-hero-tab-" + page.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={"mobile-hero-panel-" + page.id}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectPage(index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={[
                  "flex min-h-14 min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-1 text-[9px] font-semibold transition-colors min-[380px]:text-[10px]",
                  selected
                    ? "bg-sky-400/[0.12] text-sky-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)]"
                    : "text-slate-500 active:bg-white/[0.05] active:text-slate-300",
                ].join(" ")}
              >
                <Icon size={16} strokeWidth={selected ? 2.2 : 1.8} />
                <span className="truncate">{page.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
