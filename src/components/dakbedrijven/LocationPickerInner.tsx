"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, LocateFixed, Loader2 } from "lucide-react";

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

export default function LocationPickerInner({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [zoekterm, setZoekterm] = useState("");
  const [zoeken, setZoeken] = useState(false);
  const [locating, setLocating] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);

  function placeMarker(latVal: number, lngVal: number, center = true) {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([latVal, lngVal]);
    } else {
      markerRef.current = L.marker([latVal, lngVal], {
        icon: markerIcon,
        draggable: true,
      }).addTo(map);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current!.getLatLng();
        onChangeRef.current(pos.lat, pos.lng);
      });
    }
    if (center) map.setView([latVal, lngVal], Math.max(map.getZoom(), 13));
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      lat != null && lng != null ? [lat, lng] : DEFAULT_CENTER,
      lat != null && lng != null ? 13 : DEFAULT_ZOOM,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng, false);
      onChangeRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    if (lat != null && lng != null) placeMarker(lat, lng, false);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleZoek(e: React.FormEvent) {
    e.preventDefault();
    if (!zoekterm.trim()) return;
    setZoeken(true);
    setMelding(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          zoekterm,
        )}`,
      );
      const results = await res.json();
      if (!Array.isArray(results) || results.length === 0) {
        setMelding("Geen resultaat gevonden voor dit adres.");
        return;
      }
      const foundLat = parseFloat(results[0].lat);
      const foundLng = parseFloat(results[0].lon);
      placeMarker(foundLat, foundLng);
      onChangeRef.current(foundLat, foundLng);
    } catch {
      setMelding("Zoeken via de kaart is mislukt. Probeer het later opnieuw.");
    } finally {
      setZoeken(false);
    }
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      setMelding("Locatiebepaling wordt niet ondersteund door je browser.");
      return;
    }
    setLocating(true);
    setMelding(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placeMarker(pos.coords.latitude, pos.coords.longitude);
        onChangeRef.current(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setMelding("Kon je locatie niet bepalen.");
        setLocating(false);
      },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleZoek} className="flex flex-1 min-w-[200px] gap-2">
          <div className="relative flex flex-1 items-center">
            <Search size={15} className="absolute left-3 text-zinc-500" />
            <input
              value={zoekterm}
              onChange={(e) => setZoekterm(e.target.value)}
              placeholder="Zoek adres om pin te plaatsen..."
              className="w-full rounded-xl border border-white/10 bg-zinc-900/50 pl-9 pr-3 py-2 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10"
            />
          </div>
          <button
            type="submit"
            disabled={zoeken}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/40 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {zoeken && <Loader2 size={13} className="animate-spin" />}
            Zoek
          </button>
        </form>
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/40 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {locating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <LocateFixed size={14} />
          )}
          Mijn locatie
        </button>
      </div>

      {melding && <p className="text-xs text-rose-400">{melding}</p>}

      <div
        ref={containerRef}
        className="h-64 w-full overflow-hidden rounded-2xl border border-white/10"
      />

      <p className="text-xs text-zinc-500">
        Klik op de kaart, sleep de pin, of zoek een adres om de locatie te zetten.{" "}
        {lat != null && lng != null
          ? `Huidige pin: ${lat.toFixed(5)}, ${lng.toFixed(5)}.`
          : "Nog geen pin geplaatst (optioneel)."}
      </p>
    </div>
  );
}
