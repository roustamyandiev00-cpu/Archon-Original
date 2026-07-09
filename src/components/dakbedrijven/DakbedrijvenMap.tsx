"use client";

import dynamic from "next/dynamic";
import type { MapBedrijf } from "./DakbedrijvenMapInner";

const DakbedrijvenMapInner = dynamic(() => import("./DakbedrijvenMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/40 text-xs text-zinc-500">
      Kaart wordt geladen...
    </div>
  ),
});

export default function DakbedrijvenMap({ bedrijven }: { bedrijven: MapBedrijf[] }) {
  return <DakbedrijvenMapInner bedrijven={bedrijven} />;
}
