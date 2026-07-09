import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Users, Clock, XCircle } from "lucide-react";
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

export const metadata = { title: "Werkpost — ArchonPro" };

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
  if (companyIds.length > 0) {
    const { data: bedrijven } = await supabase
      .from("bedrijven_directory")
      .select("id, naam")
      .in("id", companyIds);
    for (const b of bedrijven ?? []) {
      if (b.id != null) naamMap.set(b.id, b.naam ?? `Bedrijf #${b.id}`);
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
      <Link
        href="/dashboard/werkposts"
        className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <ArrowLeft
          size={15}
          className="transition-transform group-hover:-translate-x-0.5"
        />
        Terug naar Bouwnetwerk
      </Link>

      <GlowCard innerClassName="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${tMeta.tone}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${tMeta.dot}`} />
                {tMeta.label}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${sMeta.tone}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${sMeta.dot}`} />
                {sMeta.label}
              </span>
              {werkpost.urgentie !== "normaal" && (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${uMeta.tone}`}>
                  {uMeta.label}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-xl font-semibold text-zinc-50">
              {werkpost.titel}
            </h1>
          </div>

          {werkpost.status !== "gesloten" && (
            <form action={sluiten}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-rose-500/40 hover:text-rose-400"
              >
                <XCircle size={15} /> Sluiten
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-sm text-zinc-300">{werkpost.beschrijving}</p>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} /> {werkpost.regio}
            {werkpost.stad ? ` · ${werkpost.stad}` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={13} /> {werkpost.aantal_personen} persoon
            {werkpost.aantal_personen === 1 ? "" : "en"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} /> Start {formatDate(werkpost.startdatum)}
          </span>
          <span>{formatTarief(werkpost)}</span>
        </div>

        <div className="mt-4">
          <LikeButton
            werkpostId={werkpost.id}
            initialLiked={likedByMe}
            initialCount={likeCount}
            isLoggedIn={Boolean(user)}
          />
        </div>

        {werkpost.fotos && werkpost.fotos.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {werkpost.fotos.map((url, i) => (
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
                  alt={`Foto ${i + 1} bij ${werkpost.titel}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform hover:scale-105"
                />
              </a>
            ))}
          </div>
        )}
      </GlowCard>

      <GlowCard innerClassName="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Reacties
          </h2>
          <span className="text-xs text-zinc-500">{reacties.length} totaal</span>
        </div>

        {reacties.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-500">
            Nog geen reacties op deze werkpost.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {reacties.map((r) => {
              const rMeta = reactieStatusMeta(r.status);
              return (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-zinc-100">
                      {naamMap.get(r.company_id) ?? `Bedrijf #${r.company_id}`}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${rMeta.tone}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${rMeta.dot}`} />
                      {rMeta.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-zinc-300">{r.bericht}</p>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-zinc-500">
                    {r.voorgesteld_tarief && (
                      <span>Voorgesteld tarief: € {r.voorgesteld_tarief}/u</span>
                    )}
                    <span>{formatDate(r.created_at)}</span>
                  </div>

                  {(r.status ?? "in_afwachting") === "in_afwachting" && (
                    <div className="mt-3">
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
