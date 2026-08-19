import type { Metadata } from "next";
import Link from "next/link";
import { HardHat, MapPin, Users, Clock, Plus, Search, MessageSquare, AlertTriangle, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/company";
import {
  typeMeta,
  urgentieMeta,
  formatDate,
  formatTarief,
  type WerkpostRow,
} from "@/lib/werkposts";
import ReactieForm from "@/components/werkposts/ReactieForm";
import WerkpostForm from "@/components/werkposts/WerkpostForm";
import LikeButton from "@/components/werkposts/LikeButton";
import RapporteerButton from "@/components/bouwnetwerk/RapporteerButton";
import CompanySetupCard from "@/components/werkposts/CompanySetupCard";
import CompanyReviewsTrigger from "@/components/werkposts/CompanyReviewsTrigger";
import DraggablePhoneVisual from "@/components/werkposts/DraggablePhoneVisual";

export const metadata: Metadata = {
  title: "Bouwnetwerk — Personeel voor onderaanneming | ArchonPro",
  description:
    "Vind of bied personeel voor onderaanneming in de bouw. Plaats een aanvraag of aanbod, reageer op andere bedrijven en chat verder zodra je een match hebt.",
};

export default async function BouwnetwerkPage({
  searchParams,
}: {
  searchParams: Promise<{ regio?: string; type?: string }>;
}) {
  const { regio, type } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("werkposts")
    .select(
      "id, titel, beschrijving, aard_van_werk, type, status, urgentie, regio, stad, postcode, adres, aantal_personen, startdatum, einddatum, geschatte_duur_dagen, budget_min, budget_max, tarief_per_uur, tarief_type, vereiste_vaardigheden, fotos, company_id, company_naam, created_by_user_id, aantal_reacties, aantal_views, created_at",
    )
    .eq("status", "open")
    .eq("is_actief", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (regio) query = query.ilike("regio", `%${regio}%`);
  if (type === "aanbod" || type === "vraag") query = query.eq("type", type);

  const { data } = await query;
  const posts = (data ?? []) as WerkpostRow[];

  const { companyId } = user ? await getCompanyContext() : { companyId: null };

  const likeCountByPost = new Map<string, number>();
  const likedByMe = new Set<string>();
  const postIds = posts.map((p) => p.id);

  if (postIds.length > 0) {
    const { data: likeRows } = await supabase
      .from("werkpost_likes")
      .select("werkpost_id, user_id")
      .in("werkpost_id", postIds);
    for (const l of likeRows ?? []) {
      likeCountByPost.set(
          l.werkpost_id,
          (likeCountByPost.get(l.werkpost_id) ?? 0) + 1,
      );
      if (user && l.user_id === user.id) likedByMe.add(l.werkpost_id);
    }
  }

  // Reviews ophalen voor de getoonde bedrijven.
  const companyIds = [...new Set(posts.map((p) => p.company_id).filter(Boolean))];
  const ratingsMap = new Map<number, { avg: number; count: number }>();
  if (companyIds.length > 0) {
    const { data: reviewData } = await supabase
      .from("bedrijf_reviews")
      .select("target_company_id, rating")
      .in("target_company_id", companyIds);

    const totals = new Map<number, { sum: number; count: number }>();
    for (const r of reviewData ?? []) {
      const current = totals.get(r.target_company_id) ?? { sum: 0, count: 0 };
      totals.set(r.target_company_id, {
        sum: current.sum + r.rating,
        count: current.count + 1,
      });
    }

    for (const [cid, val] of totals.entries()) {
      ratingsMap.set(cid, {
        avg: Math.round((val.sum / val.count) * 10) / 10,
        count: val.count,
      });
    }
  }


  return (
    <>
      <Navbar />
      <main className="bg-zinc-950 min-h-screen text-zinc-100 selection:bg-sky-500/30 selection:text-sky-200">
        <PageHero
          variant="panel"
          kicker={
            <>
              <HardHat size={13} className="text-emerald-400 mr-1" /> Bouwnetwerk
            </>
          }
          title="Personeel vinden voor"
          accent="onderaanneming"
          subtitle="Plaats een aanvraag of een aanbod, bekijk wie in jouw regio personeel zoekt of aanbiedt, en chat direct verder zodra je een match accepteert."
          primary={{ label: "Bekijk openstaande posts", href: "#lijst" }}
          secondary={
            user
              ? { label: "Plaats een werkpost", href: "#plaatsen" }
              : { label: "Log in om te plaatsen", href: "/login?redirect=/bouwnetwerk" }
          }
          visual={<DraggablePhoneVisual />}
        />

        <section id="lijst" className="relative py-20">
          <div className="mx-auto max-w-5xl px-6">
            {/* Filter Pane */}
            <div className="mb-10 rounded-2xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-md">
              <form className="flex flex-wrap items-end gap-4" method="get">
                <div className="flex-1 min-w-[240px]">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Zoeken op regio / provincie
                  </label>
                  <div className="relative flex items-center">
                    <Search size={16} className="absolute left-3.5 text-zinc-500" />
                    <input
                      name="regio"
                      defaultValue={regio ?? ""}
                      placeholder="bijv. Antwerpen, Limburg..."
                      className="w-full rounded-xl border border-white/10 bg-zinc-950/50 pl-10 pr-4 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10"
                    />
                  </div>
                </div>
                
                <div className="w-full sm:w-[220px]">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Type bericht
                  </label>
                  <select
                    name="type"
                    defaultValue={type ?? ""}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/50 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-all focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10"
                  >
                    <option value="">Alles tonen</option>
                    <option value="vraag">Personeel gezocht (Vraag)</option>
                    <option value="aanbod">Personeel beschikbaar (Aanbod)</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-sky-400 hover:shadow-[0_0_12px_rgba(14,165,233,0.25)]"
                  >
                    Filter toepassen
                  </button>
                  {(regio || type) && (
                    <Link
                      href="/bouwnetwerk#lijst"
                      className="rounded-xl border border-white/10 bg-zinc-900/20 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5"
                    >
                      Wissen
                    </Link>
                  )}
                </div>
                
                <span className="ml-auto text-xs font-medium text-zinc-500 self-center">
                  {posts.length} openstaande post{posts.length === 1 ? "" : "s"}
                </span>
              </form>
            </div>

            {/* Post Feed */}
            {posts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-900/20 px-6 py-20 text-center">
                <AlertTriangle className="mx-auto text-zinc-600 mb-3" size={32} />
                <p className="text-base font-medium text-zinc-400">Geen openstaande posts gevonden</p>
                <p className="text-sm text-zinc-500 mt-1">Pas je filters aan of wees de eerste om een post te plaatsen.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {posts.map((post) => {
                  const isOwnPost = companyId === post.company_id;
                  const tMeta = typeMeta(post.type);
                  const uMeta = urgentieMeta(post.urgentie);
                  return (
                    <div
                      key={post.id}
                      className="group rounded-3xl border border-white/5 bg-zinc-900/35 p-6 backdrop-blur-md transition-all duration-300 hover:border-zinc-800 hover:bg-zinc-900/50"
                    >
                      {/* Card Header */}
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-4 mb-5">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${tMeta.tone}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${tMeta.dot}`} />
                              {tMeta.label}
                            </span>
                            {post.urgentie !== "normaal" && (
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${uMeta.tone}`}
                              >
                                {uMeta.label}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-zinc-100 group-hover:text-sky-400 transition-colors">
                            {post.titel}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-400">
                            <Building2 size={14} className="text-sky-400/80 mr-0.5" />
                            {post.company_id ? (
                              <CompanyReviewsTrigger
                                companyId={post.company_id}
                                companyName={post.company_naam ?? "Onbekend bedrijf"}
                                avgRating={ratingsMap.get(post.company_id)?.avg ?? 0}
                                reviewCount={ratingsMap.get(post.company_id)?.count ?? 0}
                              />
                            ) : (
                              <span className="font-semibold text-zinc-300">{post.company_naam ?? "Onbekend bedrijf"}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-xs text-zinc-500 block uppercase tracking-wider">Tarief / Budget</span>
                          <span className="text-lg font-bold text-zinc-50 tracking-tight">
                            {formatTarief(post)}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <p className="text-sm leading-relaxed text-zinc-300 font-normal">
                        {post.beschrijving}
                      </p>

                      {/* Details Grid */}
                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl bg-zinc-950/40 p-4 border border-white/5 text-xs text-zinc-400">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-sky-400 shrink-0" />
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase">Locatie</span>
                            <span className="font-medium text-zinc-300">
                              {post.regio}{post.stad ? `, ${post.stad}` : ""}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-sky-400 shrink-0" />
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase">Personeel</span>
                            <span className="font-medium text-zinc-300">
                              {post.aantal_personen} {post.aantal_personen === 1 ? "persoon" : "personen"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-sky-400 shrink-0" />
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase">Startdatum</span>
                            <span className="font-medium text-zinc-300">
                              {formatDate(post.startdatum)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-sky-400 shrink-0" />
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase">Einddatum</span>
                            <span className="font-medium text-zinc-300">
                              {post.einddatum ? formatDate(post.einddatum) : "Onbepaald"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Vaardigheden / Tags */}
                      {post.vereiste_vaardigheden && post.vereiste_vaardigheden.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] uppercase font-semibold text-zinc-500 mr-1.5">Vaardigheden:</span>
                          {post.vereiste_vaardigheden.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-lg bg-zinc-900 border border-white/5 px-2 py-0.5 text-xs text-zinc-300 font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Photos Gallery */}
                      {post.fotos && post.fotos.length > 0 && (
                        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {post.fotos.slice(0, 4).map((url, i) => (
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
                                alt={`Foto ${i + 1} bij ${post.titel}`}
                                loading="lazy"
                                className="aspect-[4/3] w-full object-cover transition-transform duration-350 hover:scale-105"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-5">
                        <div className="flex items-center gap-4">
                          <LikeButton
                            werkpostId={post.id}
                            initialLiked={likedByMe.has(post.id)}
                            initialCount={likeCountByPost.get(post.id) ?? 0}
                            isLoggedIn={Boolean(user)}
                          />
                          {user && (
                            <RapporteerButton
                              targetType="werkpost"
                              targetId={post.id}
                              compact
                            />
                          )}
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                            <MessageSquare size={14} />
                            {post.aantal_reacties ?? 0} { (post.aantal_reacties ?? 0) === 1 ? "reactie" : "reacties" }
                          </span>
                        </div>
                        
                        {!isOwnPost && !user && (
                          <Link
                            href={`/login?redirect=/bouwnetwerk`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-400 transition-colors hover:text-sky-300"
                          >
                            Log in om te reageren &rarr;
                          </Link>
                        )}
                      </div>

                      {/* Interactive forms (reageren of beheren) */}
                      {!isOwnPost && user && (
                        <div className="mt-5 border-t border-white/5 pt-5">
                          <ReactieForm werkpostId={post.id} hasCompany={Boolean(companyId)} />
                        </div>
                      )}

                      {isOwnPost && (
                        <div className="mt-5 border-t border-white/5 pt-5 text-right">
                          <Link
                            href={`/dashboard/werkposts/${post.id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-sky-300"
                          >
                            Beheer je post en reacties in het dashboard &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Placing Post Section */}
        <section id="plaatsen" className="relative py-20 border-t border-white/5 bg-zinc-900/10">
          <div className="mx-auto max-w-3xl px-6">
            <div className="mb-10 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Zelf plaatsen</span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-50 sm:text-4xl">
                Plaats een aanvraag of aanbod
              </h2>
              <p className="mt-3 text-base text-zinc-400">
                Geef aan hoeveel personen je zoekt of beschikbaar hebt, in welke regio en voor hoelang. Andere bedrijven nemen direct contact met je op.
              </p>
            </div>

            {user && companyId ? (
              <div className="rounded-3xl border border-white/5 bg-zinc-900/40 p-6 sm:p-8 backdrop-blur-md">
                <WerkpostForm />
              </div>
            ) : user && !companyId ? (
              <div className="rounded-3xl border border-white/5 bg-zinc-900/40 p-6 sm:p-8 backdrop-blur-md">
                <CompanySetupCard />
              </div>
            ) : (
              <div className="rounded-3xl border border-white/5 bg-zinc-900/40 p-8 text-center backdrop-blur-md">
                <p className="text-zinc-300 font-medium">
                  Je moet ingelogd zijn met een bedrijfsaccount om een post te plaatsen.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/login?redirect=/bouwnetwerk"
                    className="rounded-full border border-white/10 px-5.5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/5"
                  >
                    Inloggen
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5.5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-sky-400 hover:shadow-[0_0_12px_rgba(14,165,233,0.3)]"
                  >
                    <Plus size={16} /> Gratis account maken
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
