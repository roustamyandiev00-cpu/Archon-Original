"use client";

import dynamic from "next/dynamic";
import type { MapWinkel } from "./BouwmaterialenMapInner";

const BouwmaterialenMapInner = dynamic(() => import("./BouwmaterialenMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/40 text-xs text-zinc-500">
      Kaart wordt geladen...
    </div>
  ),
});

export default function BouwmaterialenMap({ winkels }: { winkels: MapWinkel[] }) {
  return <BouwmaterialenMapInner winkels={winkels} />;
}
