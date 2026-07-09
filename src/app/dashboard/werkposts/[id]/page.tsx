import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Users, Clock, XCircle, Building2, Euro, MessageSquare } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import {
  typeMeta,
  statusMeta,
  urgentieMeta,
  reactieStatusMeta,
  formatDate,
  formatTarief,
  type WerkpostRow,
  type WerkpostReactieRow,
} from "@/lib/werkposts";
import GlowCard from "@/components/dashboard/GlowCard";
import ReactieActions from "@/components/werkposts/ReactieActions";
import LikeButton from "@/components/werkposts/LikeButton";
import { sluitWerkpost } from "@/app/dashboard/werkposts/actions";
import CompanyReviewsTrigger from "@/components/werkposts/CompanyReviewsTrigger";

export const metadata = { title: "Werkpost beheer — ArchonPro" };

export default async function WerkpostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, companyId } = await getCompanyContext();

  if (!companyId) notFound();

  const { data: post } = await supabase
    .from("werkposts")
    .select(
      "id, titel, beschrijving, aard_van_werk, type, status, urgentie, regio, stad, postcode, adres, aantal_personen, startdatum, einddatum, geschatte_duur_dagen, budget_min, budget_max, tarief_per_uur, tarief_type, vereiste_vaardigheden, fotos, company_id, company_naam, created_by_user_id, aantal_reacties, aantal_views, created_at",
    )
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!post) notFound();
  const werkpost = post as WerkpostRow;

  const { data: reactiesData } = await supabase
    .from("werkpost_reacties")
    .select(
      "id, werkpost_id, company_id, user_id, bericht, voorgesteld_tarief, beschikbaarheid_vanaf, beschikbaarheid_tot, status, created_at",
    )
    .eq("werkpost_id", id)
    .order("created_at", { ascending: false });

  const reacties = (reactiesData ?? []) as WerkpostReactieRow[];

  const { data: likeRows } = await supabase
    .from("werkpost_likes")
    .select("user_id")
    .eq("werkpost_id", id);
  const likeCount = likeRows?.length ?? 0;
  const likedByMe = Boolean(
    user && (likeRows ?? []).some((l) => l.user_id === user.id),
  );

  const companyIds = [...new Set(reacties.map((r) => r.company_id))];
  const naamMap = new Map<number, string>();
  const ratingsMap = new Map<number, { avg: number; count: number }>();
  if (companyIds.length > 0) {
    const { data: bedrijven } = await supabase
      .from("bedrijven_directory")
      .select("id, naam")
      .in("id", companyIds);
    for (const b of bedrijven ?? []) {
      if (b.id != null) naamMap.set(b.id, b.naam ?? `Bedrijf #${b.id}`);
    }

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

  const tMeta = typeMeta(werkpost.type);
  const sMeta = statusMeta(werkpost.status);
  const uMeta = urgentieMeta(werkpost.urgentie);

  async function sluiten() {
    "use server";
    await sluitWerkpost(id);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/dashboard/werkposts"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft
            size={15}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Terug naar overzicht
        </Link>
      </div>

      {/* Main post details GlowCard */}
      <GlowCard innerClassName="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-5 mb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tMeta.tone}`}
              >
                <span className={`h-1 w-1 rounded-full ${tMeta.dot}`} />
                {tMeta.label}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sMeta.tone}`}
              >
                <span className={`h-1 w-1 rounded-full ${sMeta.dot}`} />
                {sMeta.label}
              </span>
              {werkpost.urgentie !== "normaal" && (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${uMeta.tone}`}>
                  {uMeta.label}
                </span>
              )}
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
              {werkpost.titel}
            </h1>
          </div>

          {werkpost.status !== "gesloten" && (
            <form action={sluiten}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/20 px-4 py-2 text-xs font-semibold text-zinc-400 transition-all hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-400"
              >
                <XCircle size={14} /> Werkpost sluiten
              </button>
            </form>
          )}
        </div>

        {/* Description */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Projectomschrijving</h3>
          <p className="text-sm leading-relaxed text-zinc-300 font-normal whitespace-pre-line bg-zinc-950/30 p-4 border border-white/5 rounded-2xl">
            {werkpost.beschrijving}
          </p>
        </div>

        {/* Details grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-2xl bg-zinc-950/20 border border-white/5 p-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-sky-400 shrink-0" />
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Locatie</span>
              <span className="font-semibold text-zinc-200">
                {werkpost.regio}{werkpost.stad ? `, ${werkpost.stad}` : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users size={14} className="text-sky-400 shrink-0" />
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Personeel</span>
              <span className="font-semibold text-zinc-200">
                {werkpost.aantal_personen} {werkpost.aantal_personen === 1 ? "persoon" : "personen"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={14} className="text-sky-400 shrink-0" />
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Startdatum</span>
              <span className="font-semibold text-zinc-200">
                {formatDate(werkpost.startdatum)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Euro size={14} className="text-sky-400 shrink-0" />
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Tarief / Budget</span>
              <span className="font-semibold text-zinc-200">
                {formatTarief(werkpost)}
              </span>
            </div>
          </div>
        </div>

        {/* Vaardigheden tags */}
        {werkpost.vereiste_vaardigheden && werkpost.vereiste_vaardigheden.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1.5">Vaardigheden:</span>
            {werkpost.vereiste_vaardigheden.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-zinc-900 border border-white/5 px-2.5 py-0.5 text-xs text-zinc-300 font-semibold"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Likes bar */}
        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-5">
          <LikeButton
            werkpostId={werkpost.id}
            initialLiked={likedByMe}
            initialCount={likeCount}
            isLoggedIn={Boolean(user)}
          />
          <span className="text-xs text-zinc-500 font-medium">
            Aangemaakt op {formatDate(werkpost.created_at)}
          </span>
        </div>

        {/* Photos */}
        {werkpost.fotos && werkpost.fotos.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Werfafbeeldingen</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {werkpost.fotos.map((url, i) => (
                <a
                  key={`${url}-${i}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-xl border border-white/5 bg-zinc-950 transition-all hover:border-zinc-700"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Foto ${i + 1} bij ${werkpost.titel}`}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </GlowCard>

      {/* Responses container */}
      <GlowCard innerClassName="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 bg-zinc-900/10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Ontvangen reacties van bedrijven
          </h2>
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400 font-medium">
            {reacties.length} totaal
          </span>
        </div>

        {reacties.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <MessageSquare size={28} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-base font-semibold text-zinc-400">Nog geen reacties ontvangen</p>
            <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
              Zodra een ander bouwbedrijf reageert op je post, verschijnt de reactie hier en ontvang je een melding.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 bg-zinc-900/10">
            {reacties.map((r) => {
              const rMeta = reactieStatusMeta(r.status);
              return (
                <div key={r.id} className="p-5 sm:p-6 transition-colors hover:bg-white/[0.01]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 size={14} className="text-sky-400 shrink-0" />
                          {r.company_id ? (
                            <CompanyReviewsTrigger
                              companyId={r.company_id}
                              companyName={naamMap.get(r.company_id) ?? `Bedrijf #${r.company_id}`}
                              avgRating={ratingsMap.get(r.company_id)?.avg ?? 0}
                              reviewCount={ratingsMap.get(r.company_id)?.count ?? 0}
                            />
                          ) : (
                            <span className="font-semibold text-zinc-100">
                              {naamMap.get(r.company_id) ?? `Bedrijf #${r.company_id}`}
                            </span>
                          )}
                        </div>
                        
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${rMeta.tone}`}
                        >
                          <span className={`h-1 w-1 rounded-full ${rMeta.dot}`} />
                          {rMeta.label}
                        </span>
                      </div>
                      
                      <span className="text-[10px] text-zinc-500 block">
                        Verstuurd op {formatDate(r.created_at)}
                      </span>
                    </div>

                    {r.voorgesteld_tarief && (
                      <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-3 py-1 text-xs font-semibold text-emerald-400">
                        Voorgesteld tarief: € {r.voorgesteld_tarief}/u
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-zinc-300 bg-zinc-950/20 p-3.5 border border-white/5 rounded-xl font-normal">
                    {r.bericht}
                  </p>

                  {(r.status ?? "in_afwachting") === "in_afwachting" && (
                    <div className="mt-4 pt-1">
                      <ReactieActions reactieId={r.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlowCard>
    </div>
  );
}
