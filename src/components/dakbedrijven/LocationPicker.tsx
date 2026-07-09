"use client";

import dynamic from "next/dynamic";

// Leaflet raakt `window` aan bij het inladen — mag dus nooit server-side
// gerenderd worden. next/dynamic met ssr:false zorgt dat dit alleen in de
// browser gebeurt (mag alleen vanuit een Client Component, vandaar de
// wrapper hier).
const LocationPickerInner = dynamic(() => import("./LocationPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/40 text-xs text-zinc-500">
      Kaart wordt geladen...
    </div>
  ),
});

export default function LocationPicker(props: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  return <LocationPickerInner {...props} />;
}
