"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X, ChevronDown } from "lucide-react";

const functies = [
  { label: "AI-metgezel", href: "/functies/ai-metgezel" },
  { label: "Schatting", href: "/functies/schatting" },
  { label: "Facturen", href: "/functies/facturen" },
  { label: "Integraties", href: "/functies/integraties" },
];

const links = [
  { label: "Welkom", href: "/" },
  { label: "Functies", href: "/#features", children: functies },
  { label: "Over", href: "/#resultaten" },
  { label: "Bouwnetwerk", href: "/bouwnetwerk" },
  { label: "Prijzen", href: "/prijzen" },
  { label: "Blog", href: "/#blog" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [funcOpen, setFuncOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav className="mt-4 flex items-center justify-between rounded-full border border-white/10 bg-zinc-900/60 px-4 py-2.5 backdrop-blur-xl">
          <a href="/" className="flex items-center gap-2 pl-1">
            <Image
              src="/logo-tile.png"
              alt="ArchonPro logo"
              width={36}
              height={36}
              priority
              className="h-9 w-9 rounded-lg"
            />
            <span className="text-base font-semibold tracking-tight text-zinc-50">
              ArchonPro
            </span>
          </a>

          <div className="hidden items-center gap-7 md:flex">
            {links.map((l) =>
              l.children ? (
                <div key={l.label} className="group relative">
                  <button className="flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-50">
                    {l.label}
                    <ChevronDown
                      size={14}
                      className="transition-transform group-hover:rotate-180"
                    />
                  </button>
                  <div className="invisible absolute left-1/2 top-full z-10 -translate-x-1/2 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                    <div className="w-52 rounded-2xl border border-white/10 bg-zinc-900/95 p-2 backdrop-blur-xl">
                      {l.children.map((c) => (
                        <a
                          key={c.label}
                          href={c.href}
                          className="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-50"
                        >
                          {c.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-sm text-zinc-400 transition-colors hover:text-zinc-50"
                >
                  {l.label}
                </a>
              )
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-50"
            >
              Inloggen
            </a>
            <a
              href="/register"
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400"
            >
              Start gratis
            </a>
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
                          <a
                            key={c.label}
                            href={c.href}
                            onClick={() => setOpen(false)}
                            className="block rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                          >
                            {c.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
                  >
                    {l.label}
                  </a>
                )
              )}

              <a
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Inloggen
              </a>
              <a
                href="/register"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-full bg-sky-500 px-4 py-2.5 text-center text-sm font-medium text-zinc-950"
              >
                Start gratis
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
