import type { Metadata } from "next";
import Link from "next/link";
import { HardHat, MapPin, Users, Clock, Plus } from "lucide-react";
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
import CompanySetupCard from "@/components/werkposts/CompanySetupCard";

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

  // Likes ophalen voor de getoonde posts (tellingen + of ik zelf geliket heb).
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

  return (
    <>
      <Navbar />
      <main>
        <PageHero
          variant="panel"
          kicker={
            <>
              <HardHat size={13} /> Bouwnetwerk
            </>
          }
          title="Personeel vinden voor"
          accent="onderaanneming"
          subtitle="Plaats een aanvraag of een aanbod, bekijk wie in jouw regio personeel zoekt of aanbiedt, en chat verder zodra je een match accepteert."
          primary={{ label: "Bekijk openstaande posts", href: "#lijst" }}
          secondary={
            user
              ? { label: "Plaats een werkpost", href: "#plaatsen" }
              : { label: "Log in om te plaatsen", href: "/login?redirect=/bouwnetwerk" }
          }
        />

        <section id="lijst" className="relative py-20">
          <div className="mx-auto max-w-6xl px-6">
            <form className="mb-8 flex flex-wrap items-end gap-3" method="get">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
                  Regio
                </label>
                <input
                  name="regio"
                  defaultValue={regio ?? ""}
                  placeholder="bijv. Antwerpen"
                  className="rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
                  Type
                </label>
                <select
                  name="type"
                  defaultValue={type ?? ""}
                  className="rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-500/60"
                >
                  <option value="">Alles</option>
                  <option value="vraag">Personeel gezocht</option>
                  <option value="aanbod">Personeel beschikbaar</option>
                </select>
              </div>
              <button
                type="submit"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/5"
              >
                Filteren
              </button>
              <span className="ml-auto text-xs text-zinc-500">
                {posts.length} openstaande post{posts.length === 1 ? "" : "s"}
              </span>
            </form>

            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 px-6 py-16 text-center text-sm text-zinc-500">
                Geen openstaande posts gevonden voor deze filters.
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post, i) => {
                  const isOwnPost = companyId === post.company_id;
                  const tMeta = typeMeta(post.type);
                  const uMeta = urgentieMeta(post.urgentie);
                  const cardRight = i % 2 === 1;
                  return (
                    <div
                      key={post.id}
                      className="grid items-center gap-6 md:grid-cols-2 md:gap-10"
                    >
                      <aside
                        className={`hidden flex-col justify-center gap-4 md:flex ${cardRight ? "md:order-1 md:items-end md:pr-2 md:text-right" : "md:order-2 md:pl-2"}`}
                      >
                        <div
                          className={`flex flex-wrap items-center gap-2 ${cardRight ? "md:justify-end" : ""}`}
                        >
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${tMeta.tone}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${tMeta.dot}`} />
                            {tMeta.label}
                          </span>
                          {post.urgentie !== "normaal" && (
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${uMeta.tone}`}
                            >
                              {uMeta.label}
                            </span>
                          )}
                        </div>
                        <p className="text-3xl font-semibold tracking-tight text-zinc-50">
                          {formatTarief(post)}
                        </p>
                        <dl className="space-y-2 text-sm text-zinc-400">
                          <div
                            className={`flex items-center gap-2 ${cardRight ? "md:justify-end" : ""}`}
                          >
                            <MapPin size={14} className="text-sky-400" />
                            {post.regio}
                            {post.stad ? ` · ${post.stad}` : ""}
                          </div>
                          <div
                            className={`flex items-center gap-2 ${cardRight ? "md:justify-end" : ""}`}
                          >
                            <Users size={14} className="text-sky-400" />
                            {post.aantal_personen} persoon
                            {post.aantal_personen === 1 ? "" : "en"}
                          </div>
                          <div
                            className={`flex items-center gap-2 ${cardRight ? "md:justify-end" : ""}`}
                          >
                            <Clock size={14} className="text-sky-400" />
                            Start {formatDate(post.startdatum)}
                          </div>
                        </dl>
                      </aside>
                      <div
                        className={`rounded-2xl border border-white/10 bg-zinc-900/50 p-5 sm:p-6 ${cardRight ? "md:order-2" : "md:order-1"}`}
                      >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${tMeta.tone}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${tMeta.dot}`} />
                              {tMeta.label}
                            </span>
                            {post.urgentie !== "normaal" && (
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${uMeta.tone}`}
                              >
                                {uMeta.label}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-zinc-50">
                            {post.titel}
                          </h3>
                          <p className="text-sm text-zinc-500">
                            {post.company_naam ?? "Onbekend bedrijf"}
                          </p>
                        </div>
                        <div className="text-right text-sm text-zinc-400">
                          {formatTarief(post)}
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-zinc-300">{post.beschrijving}</p>

                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={13} /> {post.regio}
                          {post.stad ? ` · ${post.stad}` : ""}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users size={13} /> {post.aantal_personen} persoon
                          {post.aantal_personen === 1 ? "" : "en"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={13} /> Start {formatDate(post.startdatum)}
                        </span>
                      </div>

                      {post.fotos && post.fotos.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {post.fotos.slice(0, 4).map((url, i) => (
                            <a
                              key={`${url}-${i}`}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-xl border border-white/10"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Foto ${i + 1} bij ${post.titel}`}
                                loading="lazy"
                                className="aspect-[4/3] w-full object-cover transition-transform hover:scale-105"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-3">
                        <LikeButton
                          werkpostId={post.id}
                          initialLiked={likedByMe.has(post.id)}
                          initialCount={likeCountByPost.get(post.id) ?? 0}
                          isLoggedIn={Boolean(user)}
                        />
                        <span className="text-xs text-zinc-500">
                          {post.aantal_reacties ?? 0} reactie
                          {(post.aantal_reacties ?? 0) === 1 ? "" : "s"}
                        </span>
                      </div>

                      {!isOwnPost && (
                        <div className="mt-5 border-t border-white/10 pt-4">
                          {user ? (
                            <ReactieForm werkpostId={post.id} />
                          ) : (
                            <Link
                              href={`/login?redirect=/bouwnetwerk`}
                              className="text-sm font-medium text-sky-400 hover:text-sky-300"
                            >
                              Log in om te reageren →
                            </Link>
                          )}
                        </div>
                      )}
                      {isOwnPost && (
                        <div className="mt-5 border-t border-white/10 pt-4">
                          <Link
                            href={`/dashboard/werkposts/${post.id}`}
                            className="text-sm font-medium text-sky-400 hover:text-sky-300"
                          >
                            Beheer je post en reacties in het dashboard →
                          </Link>
                        </div>
                      )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section id="plaatsen" className="relative py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-8 text-center">
              <p className="text-sm font-medium text-sky-400">Zelf plaatsen</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">
                Plaats een aanvraag of aanbod
              </h2>
              <p className="mt-3 text-zinc-400">
                Hoeveel mensen je nodig hebt, in welke regio, en voor hoe lang —
                andere bedrijven kunnen meteen reageren.
              </p>
            </div>

            {user && companyId ? (
              <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
                <WerkpostForm />
              </div>
            ) : user && !companyId ? (
              <CompanySetupCard />
            ) : (
              <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-8 text-center">
                <p className="text-zinc-300">
                  Je moet ingelogd zijn met een bedrijfsaccount om te plaatsen.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <Link
                    href="/login?redirect=/bouwnetwerk"
                    className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/5"
                  >
                    Inloggen
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-medium text-zinc-950 hover:bg-sky-400"
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
