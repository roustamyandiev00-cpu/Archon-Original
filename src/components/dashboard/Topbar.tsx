"use client";

import Image from "next/image";
import { Search, Bell, Radio, Activity } from "lucide-react";

export default function Topbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-white/10 bg-zinc-900/85 backdrop-blur-xl lg:left-[220px]">
      <div className="flex w-full items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5 lg:hidden">
          <Image
            src="/logo-tile.png"
            alt="ArchonPro logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg"
          />
          <span className="text-sm font-semibold text-zinc-50">ArchonPro</span>
        </div>

        <div className="hidden items-center gap-5 md:flex">
          <Stat label="Offertes vandaag" value="12" />
          <span className="h-4 w-px bg-white/10" />
          <Stat label="Verzonden" value="34" />
          <span className="h-4 w-px bg-white/10" />
          <Stat label="Pipeline" value="€ 84.2k" />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-100">
            <Search size={14} />
            <span className="hidden sm:inline">Zoeken</span>
            <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:inline">
              ⌘K
            </kbd>
          </button>

          <IconButton>
            <Bell size={16} />
            <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-sky-500 text-[9px] font-bold text-zinc-950">
              3
            </span>
          </IconButton>

          <IconButton>
            <Radio size={16} />
          </IconButton>

          <div className="ml-1 hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <Activity size={13} className="text-zinc-400" />
            <span className="font-mono text-[11px] text-zinc-400">gessynct 12s</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="font-mono text-sm font-semibold text-zinc-100">{value}</span>
    </div>
  );
}

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="relative grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100">
      {children}
    </button>
  );
}
