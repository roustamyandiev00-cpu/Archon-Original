"use client";

import { useState } from "react";
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

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [funcOpen, setFuncOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="mt-4 flex items-center justify-between rounded-full border border-white/[0.08] bg-zinc-950/55 px-4 py-2.5 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2 pl-1">
            <Image
              src="/logo-tile.png"
              alt="ArchonPro logo"
              width={36}
              height={36}
              priority
              unoptimized
              className="h-9 w-9 rounded-lg"
            />
            <span className="text-base font-semibold tracking-tight text-zinc-50">
              ArchonPro
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {links.map((l) =>
              l.children ? (
                <div key={l.label} className="group relative">
                  <button className="flex items-center gap-1 text-sm font-semibold text-zinc-400 transition-colors hover:text-zinc-50">
                    {l.label}
                    <ChevronDown
                      size={14}
                      className="transition-transform group-hover:rotate-180"
                    />
                  </button>
                  <div className="invisible absolute left-1/2 top-full z-10 -translate-x-1/2 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                    <div className="w-52 rounded-2xl border border-white/10 bg-zinc-900/95 p-2 backdrop-blur-xl">
                      {l.children.map((c) => (
                        <FastLink
                          key={c.label}
                          href={c.href}
                          className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-50"
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
                  className="text-sm font-semibold text-zinc-400 hover:text-zinc-50"
                >
                  {l.label}
                </FastLink>
              )
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <FastLink
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-50"
            >
              Inloggen
            </FastLink>
            <FastLink
              href="/register"
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(14,165,233,0.45)] hover:bg-sky-400"
            >
              Start gratis
            </FastLink>
          </div>

          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full text-zinc-300 md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>

        {open && (
          <div className="mt-2 rounded-2xl border border-white/10 bg-zinc-900/90 p-4 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-1">
              {links.map((l) =>
                l.children ? (
                  <div key={l.label}>
                    <button
                      onClick={() => setFuncOpen((v) => !v)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
                    >
                      {l.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${funcOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {funcOpen && (
                      <div className="ml-3 border-l border-white/10 pl-2">
                        {l.children.map((c) => (
                          <FastLink
                            key={c.label}
                            href={c.href}
                            onClick={() => setOpen(false)}
                            className="block rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
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
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
                  >
                    {l.label}
                  </FastLink>
                )
              )}

              <FastLink
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Inloggen
              </FastLink>
              <FastLink
                href="/register"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-full bg-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-sky-400"
              >
                Start gratis
              </FastLink>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
