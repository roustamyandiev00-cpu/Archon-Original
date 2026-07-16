"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown } from "lucide-react";
import { FastLink } from "@/components/FastLink";

const functies = [
  { label: "Overzicht", href: "/functies" },
  { label: "AI-metgezel", href: "/functies/ai-metgezel" },
  { label: "Schatting", href: "/functies/schatting" },
  { label: "Facturen", href: "/functies/facturen" },
  { label: "Peppol & E-facturen", href: "/functies/peppol" },
  { label: "Integraties", href: "/functies/integraties" },
  { label: "Ontwikkelaars", href: "/ontwikkelaars" },
];

const links = [
  { label: "Welkom", href: "/" },
  { label: "Functies", href: "/functies", children: functies },
  { label: "Over", href: "/over" },
  { label: "Bouwnetwerk", href: "/bouwnetwerk" },
  { label: "Winkeladressen", href: "/bouwmaterialen" },
  { label: "Prijzen", href: "/prijzen" },
  { label: "Blog", href: "/blog" },
  { label: "Community", href: "/gemeenschap" },
];

type NavbarTheme = "dark" | "light";

export default function Navbar({ theme = "dark" }: { theme?: NavbarTheme }) {
  const [open, setOpen] = useState(false);
  const [funcOpen, setFuncOpen] = useState(false);
  const isLight = theme === "light";

  const closeMenu = () => {
    setOpen(false);
    setFuncOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <nav
          className={`mt-2 flex items-center justify-between rounded-2xl px-3 py-2 backdrop-blur-xl sm:mt-4 sm:rounded-full sm:px-4 sm:py-2.5 ${
            isLight
              ? "border border-zinc-200/90 bg-white/90 shadow-sm"
              : "border border-white/[0.08] bg-zinc-950/70"
          }`}
        >
          <Link href="/" className="flex min-h-10 items-center gap-2 pl-0.5 sm:pl-1">
            <Image
              src="/logo-tile.png"
              alt="ArchonPro logo"
              width={36}
              height={36}
              priority
              unoptimized
              className="h-8 w-8 rounded-lg sm:h-9 sm:w-9"
            />
            <span
              className={`text-[15px] font-semibold tracking-tight sm:text-base ${
                isLight ? "text-zinc-900" : "text-zinc-50"
              }`}
            >
              ArchonPro
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {links.map((l) =>
              l.children ? (
                <div key={l.label} className="group relative">
                  <button
                    className={`flex items-center gap-1 text-sm font-semibold transition-colors ${
                      isLight
                        ? "text-zinc-600 hover:text-zinc-900"
                        : "text-zinc-400 hover:text-zinc-50"
                    }`}
                  >
                    {l.label}
                    <ChevronDown
                      size={14}
                      className="transition-transform group-hover:rotate-180"
                    />
                  </button>
                  <div className="invisible absolute left-1/2 top-full z-10 -translate-x-1/2 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                    <div
                      className={`w-52 rounded-2xl border p-2 backdrop-blur-xl ${
                        isLight
                          ? "border-zinc-200 bg-white shadow-lg"
                          : "border-white/10 bg-zinc-900/95"
                      }`}
                    >
                      {l.children.map((c) => (
                        <FastLink
                          key={c.label}
                          href={c.href}
                          className={`block rounded-lg px-3 py-2 text-sm ${
                            isLight
                              ? "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                              : "text-zinc-300 hover:bg-white/5 hover:text-zinc-50"
                          }`}
                        >
                          {c.label}
                        </FastLink>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <FastLink
                  key={l.label}
                  href={l.href}
                  className={`text-sm font-semibold ${
                    isLight
                      ? "text-zinc-600 hover:text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-50"
                  }`}
                >
                  {l.label}
                </FastLink>
              )
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <FastLink
              href="/login"
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                isLight
                  ? "text-zinc-600 hover:text-zinc-900"
                  : "text-zinc-300 hover:text-zinc-50"
              }`}
            >
              Inloggen
            </FastLink>
            <FastLink
              href="/register"
              className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${
                isLight
                  ? "bg-blue-600 hover:bg-blue-500"
                  : "bg-sky-500 shadow-[0_0_24px_-6px_rgba(14,165,233,0.45)] hover:bg-sky-400"
              }`}
            >
              Start gratis
            </FastLink>
          </div>

          <button
            type="button"
            aria-label={open ? "Menu sluiten" : "Menu openen"}
            aria-expanded={open}
            onPointerDown={(e) => {
              e.preventDefault();
              open ? closeMenu() : setOpen(true);
            }}
            className={`grid h-10 w-10 place-items-center rounded-xl border touch-manipulation select-none md:hidden ${
              isLight
                ? "border-zinc-200 bg-zinc-50 text-zinc-700 active:bg-zinc-100"
                : "border-white/10 bg-white/[0.04] text-zinc-200 active:bg-white/[0.08]"
            }`}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {open && (
          <>
            <button
              type="button"
              aria-label="Menu sluiten"
              className={`fixed inset-0 top-[calc(3.25rem+env(safe-area-inset-top))] z-40 backdrop-blur-[2px] md:hidden ${
                isLight ? "bg-zinc-900/25" : "bg-black/55"
              }`}
              onPointerDown={(e) => { e.preventDefault(); closeMenu(); }}
            />
            <div
              className={`relative z-10 mt-2 flex max-h-[calc(100dvh-4.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl md:hidden ${
                isLight
                  ? "border-zinc-200 bg-white"
                  : "border-white/10 bg-zinc-900/95"
              }`}
            >
              <div className="flex-1 overflow-y-auto overscroll-contain p-3 [-webkit-overflow-scrolling:touch]">
                <div className="flex flex-col gap-0.5">
                  {links.map((l) =>
                    l.children ? (
                      <div key={l.label}>
                        <button
                          type="button"
                          onClick={() => setFuncOpen((v) => !v)}
                          className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium active:bg-white/5 ${
                            isLight
                              ? "text-zinc-800 active:bg-zinc-50"
                              : "text-zinc-200"
                          }`}
                        >
                          {l.label}
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${funcOpen ? "rotate-180" : ""} ${
                              isLight ? "text-zinc-400" : "text-zinc-500"
                            }`}
                          />
                        </button>
                        {funcOpen && (
                          <div
                            className={`mb-1 ml-2 space-y-0.5 border-l pl-2 ${
                              isLight ? "border-zinc-200" : "border-white/10"
                            }`}
                          >
                            {l.children.map((c) => (
                              <FastLink
                                key={c.label}
                                href={c.href}
                                onClick={closeMenu}
                                className={`flex min-h-10 items-center rounded-lg px-3 py-2 text-sm active:bg-white/5 ${
                                  isLight
                                    ? "text-zinc-600 active:bg-zinc-50 active:text-zinc-900"
                                    : "text-zinc-400 active:text-zinc-100"
                                }`}
                              >
                                {c.label}
                              </FastLink>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <FastLink
                        key={l.label}
                        href={l.href}
                        onClick={closeMenu}
                        className={`flex min-h-11 items-center rounded-xl px-3 py-2.5 text-[15px] font-medium active:bg-white/5 ${
                          isLight
                            ? "text-zinc-800 active:bg-zinc-50"
                            : "text-zinc-200"
                        }`}
                      >
                        {l.label}
                      </FastLink>
                    )
                  )}
                </div>
              </div>

              <div
                className={`shrink-0 space-y-2 border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] ${
                  isLight
                    ? "border-zinc-200 bg-zinc-50"
                    : "border-white/10 bg-zinc-950/60"
                }`}
              >
                <FastLink
                  href="/login"
                  onClick={closeMenu}
                  className={`flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium active:bg-white/5 ${
                    isLight
                      ? "border-zinc-200 text-zinc-700 active:bg-white"
                      : "border-white/10 text-zinc-200"
                  }`}
                >
                  Inloggen
                </FastLink>
                <FastLink
                  href="/register"
                  onClick={closeMenu}
                  className={`flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white active:bg-sky-400 ${
                    isLight
                      ? "bg-blue-600 active:bg-blue-500"
                      : "bg-sky-500 shadow-[0_0_24px_-6px_rgba(14,165,233,0.45)]"
                  }`}
                >
                  Start gratis — 14 dagen
                </FastLink>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
