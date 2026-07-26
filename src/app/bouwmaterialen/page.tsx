import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone, Globe, Search, AlertTriangle, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";
import {
  BOUWMATERIAAL_CATEGORIEEN,
  CATEGORIE_META,
  categorieMeta,
  formatDate,
  type BouwmateriaalWinkelRow,
} from "@/lib/bouwmaterialen";
import BouwmateriaalWinkelForm from "@/components/bouwmaterialen/BouwmateriaalWinkelForm";
import BouwmaterialenMap from "@/components/bouwmaterialen/BouwmaterialenMap";

export const metadata: Metadata = {
  title: "Winkeladressen — Bouw- & renovatiematerialen | ArchonPro",
  description:
    "Vind winkels voor bouw- en renovatiematerialen — van dak en tegels tot hout, isolatie, sanitair en verf — zonder te zoeken via Google. Bekijk adres, foto's en kaart, of voeg zelf een winkel toe.",
};

export default async function BouwmaterialenPage({
  searchParams,
}: {
  searchParams: Promise<{ regio?: string; categorie?: string; zoek?: string }>;
}) {
  const { regio, categorie, zoek } = await searchParams;

  const supabase = await createClient();

  let query = supabase
    .from("bouwmateriaal_winkels")
    .select(
      "id, naam, categorie, adres, postcode, stad, regio, telefoon, website, beschrijving, fotos, toegevoegd_door, lat, lng, verificatiestatus, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (regio) query = query.ilike("regio", `%${regio}%`);
  if (categorie) query = query.eq("categorie", categorie);
  if (zoek) query = query.ilike("naam", `%${zoek}%`);

  const { data } = await query;
  const winkels = (data ?? []) as BouwmateriaalWinkelRow[];

  const mapWinkels = winkels
    .filter((w) => w.lat != null && w.lng != null)
    .map((w) => ({
      id: w.id,
      naam: w.naam,
      categorie: w.categorie,
      lat: w.lat as number,
      lng: w.lng as number,
      adres: w.adres,
      stad: w.stad,
      verificatiestatus: w.verificatiestatus ?? "niet_geverifieerd",
    }));

  return (
    <>
      <Navbar />
      <main className="bg-zinc-950 min-h-screen text-zinc-100 selection:bg-sky-500/30 selection:text-sky-200">
        <PageHero
          variant="amber"
          kicker={
            <>
              <MapPin size={13} className="text-amber-400 mr-1" /> Winkeladressen
            </>
          }
          title="Winkels voor bouw- en renovatiematerialen"
          accent="zonder Google"
          subtitle="Adres, foto's en kaart van winkels voor dak, tegels, hout, isolatie, sanitair, elektriciteit, verf en meer — verzameld op één plek door bouwbedrijven zelf. Voeg zelf een winkel toe, geen account nodig."
          primary={{ label: "Bekijk de directory", href: "#lijst" }}
          secondary={{ label: "Voeg een winkel toe", href: "#toevoegen" }}
        />

        <section id="kaart" className="relative py-20 border-b border-white/5">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Kaart</span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-50 sm:text-3xl">
                Alle gepinde winkels
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {mapWinkels.length > 0
                  ? `${mapWinkels.length} van de ${winkels.length} winkels ${mapWinkels.length === 1 ? "heeft" : "hebben"} een pin op de kaart.`
                  : "Nog geen enkele winkel heeft een pin. Voeg er hieronder één toe."}
              </p>
            </div>
            <BouwmaterialenMap winkels={mapWinkels} />
          </div>
        </section>

        <section id="lijst" className="relative py-20">
          <div className="mx-auto max-w-5xl px-6">
            {/* Filter Pane */}
            <div className="mb-10 rounded-2xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-md">
              <form className="flex flex-wrap items-end gap-4" method="get">
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Zoeken op naam
                  </label>
                  <div className="relative flex items-center">
                    <Search size={16} className="absolute left-3.5 text-zinc-500" />
                    <input
                      name="zoek"
                      defaultValue={zoek ?? ""}
                      placeholder="bijv. Janssens"
                      className="w-full rounded-xl border border-white/10 bg-zinc-950/50 pl-10 pr-4 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Regio / provincie
                  </label>
                  <input
                    name="regio"
                    defaultValue={regio ?? ""}
                    placeholder="bijv. Antwerpen, Limburg..."
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/50 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10"
                  />
                </div>

                <div className="w-full sm:w-[200px]">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Categorie
                  </label>
                  <select
                    name="categorie"
                    defaultValue={categorie ?? ""}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/50 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-all focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10"
                  >
                    <option value="">Alles tonen</option>
                    {BOUWMATERIAAL_CATEGORIEEN.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORIE_META[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-sky-400 hover:shadow-[0_0_12px_rgba(14,165,233,0.25)]"
                  >
                    Filter toepassen
                  </button>
                  {(regio || categorie || zoek) && (
                    <Link
                      href="/bouwmaterialen#lijst"
                      className="rounded-xl border border-white/10 bg-zinc-900/20 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5"
                    >
                      Wissen
                    </Link>
                  )}
                </div>

                <span className="ml-auto text-xs font-medium text-zinc-500 self-center">
                  {winkels.length} winkel{winkels.length === 1 ? "" : "s"}
                </span>
              </form>
            </div>

            {/* Winkels Feed */}
            {winkels.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-900/20 px-6 py-20 text-center">
                <AlertTriangle className="mx-auto text-zinc-600 mb-3" size={32} />
                <p className="text-base font-medium text-zinc-400">Nog geen winkels gevonden</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Pas je filters aan of wees de eerste om een winkel toe te voegen.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {winkels.map((winkel) => {
                  const cMeta = categorieMeta(winkel.categorie);
                  return (
                    <div
                      key={winkel.id}
                      className="group rounded-3xl border border-white/5 bg-zinc-900/35 p-6 backdrop-blur-md transition-all duration-300 hover:border-zinc-800 hover:bg-zinc-900/50"
                    >
                      {/* Card Header */}
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-4 mb-5">
                        <div className="space-y-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${cMeta.tone}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${cMeta.dot}`} />
                            {cMeta.label}
                          </span>
                          <h3 className="text-xl font-bold text-zinc-100 group-hover:text-sky-400 transition-colors">
                            {winkel.naam}
                          </h3>
                        </div>

                        {winkel.toegevoegd_door && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                            <User size={12} />
                            Toegevoegd door {winkel.toegevoegd_door}
                          </span>
                        )}
                      </div>

                      {/* Card Body */}
                      {winkel.beschrijving && (
                        <p className="text-sm leading-relaxed text-zinc-300 font-normal">
                          {winkel.beschrijving}
                        </p>
                      )}

                      {/* Details Grid */}
                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl bg-zinc-950/40 p-4 border border-white/5 text-xs text-zinc-400">
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <MapPin size={14} className="text-sky-400 shrink-0" />
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase">Adres</span>
                            <span className="font-medium text-zinc-300">
                              {[winkel.adres, winkel.postcode, winkel.stad]
                                .filter(Boolean)
                                .join(", ") || winkel.regio || "Onbekend"}
                            </span>
                          </div>
                        </div>

                        {winkel.telefoon && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-sky-400 shrink-0" />
                            <div>
                              <span className="text-zinc-500 block text-[10px] uppercase">Telefoon</span>
                              <span className="font-medium text-zinc-300">{winkel.telefoon}</span>
                            </div>
                          </div>
                        )}

                        {winkel.website && (
                          <div className="flex items-center gap-2">
                            <Globe size={14} className="text-sky-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-zinc-500 block text-[10px] uppercase">Website</span>
                              <a
                                href={
                                  winkel.website.startsWith("http")
                                    ? winkel.website
                                    : `https://${winkel.website}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-sky-400 hover:text-sky-300 truncate block"
                              >
                                {winkel.website}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Photos Gallery */}
                      {winkel.fotos && winkel.fotos.length > 0 && (
                        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {winkel.fotos.slice(0, 4).map((url, i) => (
                            <a
                              key={`${url}-${i}`}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-xl border border-white/10 bg-zinc-950 transition-all hover:border-zinc-600"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Foto ${i + 1} bij ${winkel.naam}`}
                                loading="lazy"
                                className="aspect-[4/3] w-full object-cover transition-transform duration-350 hover:scale-105"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4 text-[11px] text-zinc-500">
                        <span>Toegevoegd op {formatDate(winkel.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Toevoegen Section */}
        <section id="toevoegen" className="relative py-20 border-t border-white/5 bg-zinc-900/10">
          <div className="mx-auto max-w-3xl px-6">
            <div className="mb-10 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Zelf toevoegen</span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-50 sm:text-4xl">
                Voeg een winkel voor bouwmaterialen toe
              </h2>
              <p className="mt-3 text-base text-zinc-400">
                Ken je een goede winkel voor dak, tegels, hout, isolatie, sanitair of andere
                bouwmaterialen? Voeg ze toe zodat andere bouwbedrijven ze niet meer via Google
                hoeven te zoeken. Geen account nodig.
              </p>
            </div>

            <div className="rounded-3xl border border-white/5 bg-zinc-900/40 p-6 sm:p-8 backdrop-blur-md">
              <BouwmateriaalWinkelForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
