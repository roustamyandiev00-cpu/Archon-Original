"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { categorieMeta } from "@/lib/bouwmaterialen";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [50.85, 4.35]; // België (Brussel)
const DEFAULT_ZOOM = 7;

export type MapWinkel = {
  id: number;
  naam: string;
  categorie: string;
  lat: number;
  lng: number;
  adres: string | null;
  stad: string | null;
};

function escapeHtml(str: string) {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}

export default function BouwmaterialenMapInner({
  winkels,
}: {
  winkels: MapWinkel[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = winkels.map((w) => {
      const cMeta = categorieMeta(w.categorie);
      const marker = L.marker([w.lat, w.lng], { icon: markerIcon }).addTo(map);
      const adresLijn = [w.adres, w.stad].filter(Boolean).join(", ");
      marker.bindPopup(
        `<div style="font-family:inherit;min-width:140px">
          <strong>${escapeHtml(w.naam)}</strong><br/>
          <span style="font-size:11px;color:#a1a1aa;">${escapeHtml(cMeta.label)}</span>
          ${adresLijn ? `<br/><span style="font-size:12px;">${escapeHtml(adresLijn)}</span>` : ""}
        </div>`,
      );
      return marker;
    });

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 13 });
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [winkels]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full overflow-hidden rounded-2xl border border-white/10"
    />
  );
}
