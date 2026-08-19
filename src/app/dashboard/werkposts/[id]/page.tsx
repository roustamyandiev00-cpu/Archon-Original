import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarRange,
  Clock,
  Eye,
  Euro,
  MapPin,
  MessageSquare,
  Users,
  XCircle,
} from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import {
  typeMeta,
  statusMeta,
  urgentieMeta,
  reactieStatusMeta,
  pipelineStatusMeta,
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
import RapporteerButton from "@/components/bouwnetwerk/RapporteerButton";

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
      "id, titel, beschrijving, aard_van_werk, type, status, pipeline_status, urgentie, regio, stad, postcode, adres, aantal_personen, startdatum, einddatum, geschatte_duur_dagen, budget_min, budget_max, tarief_per_uur, tarief_type, vereiste_vaardigheden, fotos, company_id, company_naam, created_by_user_id, aantal_reacties, aantal_views, created_at",
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
  const pMeta = pipelineStatusMeta(werkpost.pipeline_status);
  const reactieInAfwachting = reacties.filter(
    (reactie) => (reactie.status ?? "in_afwachting") === "in_afwachting",
  ).length;
  const locatieLabel =
    [werkpost.regio, werkpost.stad].filter(Boolean).join(", ") ||
    "Niet gespecificeerd";
  const looptijdLabel = werkpost.einddatum
    ? `${formatDate(werkpost.startdatum)} - ${formatDate(werkpost.einddatum)}`
    : werkpost.geschatte_duur_dagen
      ? `${werkpost.geschatte_duur_dagen} ${
          werkpost.geschatte_duur_dagen === 1 ? "dag" : "dagen"
        }`
      : "Looptijd niet opgegeven";

  async function sluiten() {
    "use server";
    await sluitWerkpost(id);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
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
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Werkpost detail
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Beheer reacties, controleer de opdrachtinformatie en volg de status van
            deze werkpost op.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_320px]">
        <GlowCard innerClassName="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-6">
            <div className="min-w-0 space-y-4">
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
                {pMeta && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${pMeta.tone}`}
                  >
                    <span className={`h-1 w-1 rounded-full ${pMeta.dot}`} />
                    Pipeline: {pMeta.label}
                  </span>
                )}
                {werkpost.urgentie !== "normaal" && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${uMeta.tone}`}
                  >
                    {uMeta.label}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
                  {werkpost.titel}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                  {werkpost.company_naam ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                      <Building2 size={14} className="text-sky-400" />
                      {werkpost.company_naam}
                    </span>
                  ) : null}
                  {werkpost.aard_van_werk ? (
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-zinc-300">
                      {werkpost.aard_van_werk}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {werkpost.status !== "gesloten" && (
                <form action={sluiten}>
                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-zinc-900/40 px-4 py-2 text-xs font-semibold text-zinc-300 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <XCircle size={14} /> Werkpost sluiten
                  </button>
                </form>
              )}
              <RapporteerButton targetType="werkpost" targetId={werkpost.id} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <DetailTile
              icon={<MapPin size={16} className="text-sky-400" />}
              label="Locatie"
              value={locatieLabel}
              description={werkpost.adres ?? werkpost.postcode ?? undefined}
            />
            <DetailTile
              icon={<Users size={16} className="text-sky-400" />}
              label="Personeel"
              value={`${werkpost.aantal_personen} ${
                werkpost.aantal_personen === 1 ? "persoon" : "personen"
              }`}
            />
            <DetailTile
              icon={<Clock size={16} className="text-sky-400" />}
              label="Startdatum"
              value={formatDate(werkpost.startdatum)}
              description={looptijdLabel}
            />
            <DetailTile
              icon={<Euro size={16} className="text-sky-400" />}
              label="Tarief of budget"
              value={formatTarief(werkpost)}
            />
            <DetailTile
              icon={<MessageSquare size={16} className="text-sky-400" />}
              label="Reacties"
              value={`${reacties.length} ontvangen`}
              description={
                reactieInAfwachting > 0
                  ? `${reactieInAfwachting} wachten op actie`
                  : "Geen openstaande opvolging"
              }
            />
            <DetailTile
              icon={<Eye size={16} className="text-sky-400" />}
              label="Bereik"
              value={`${werkpost.aantal_views ?? 0} views`}
              description={`${werkpost.aantal_reacties ?? reacties.length} geregistreerde reacties`}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/5 bg-zinc-950/30 p-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Projectomschrijving
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-300">
                  {werkpost.beschrijving}
                </p>
              </div>

              {werkpost.fotos && werkpost.fotos.length > 0 && (
                <div className="rounded-2xl border border-white/5 bg-zinc-950/25 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Werfafbeeldingen
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/5 bg-zinc-950/25 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Snel overzicht
                </h3>
                <div className="mt-4 space-y-3">
                  <SideStat label="Status" value={sMeta.label} />
                  <SideStat
                    label="Pipeline"
                    value={pMeta?.label ?? "Nog geen pipeline-status"}
                  />
                  <SideStat label="Urgentie" value={uMeta.label} />
                  <SideStat
                    label="Aangemaakt"
                    value={formatDate(werkpost.created_at)}
                  />
                </div>
              </div>

              {werkpost.vereiste_vaardigheden &&
              werkpost.vereiste_vaardigheden.length > 0 ? (
                <div className="rounded-2xl border border-white/5 bg-zinc-950/25 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Vaardigheden
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {werkpost.vereiste_vaardigheden.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border border-white/5 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-white/5 bg-zinc-950/25 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Betrokkenheid
                </h3>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <LikeButton
                    werkpostId={werkpost.id}
                    initialLiked={likedByMe}
                    initialCount={likeCount}
                    isLoggedIn={Boolean(user)}
                  />
                  <div className="text-right text-xs text-zinc-500">
                    <p>{reacties.length} reacties</p>
                    <p>{werkpost.aantal_views ?? 0} views</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-5">
            <span className="text-xs font-medium text-zinc-500">
              Aangemaakt op {formatDate(werkpost.created_at)}
            </span>
            <span className="text-xs text-zinc-500">
              Werkpost ID: <span className="font-mono text-zinc-400">{werkpost.id}</span>
            </span>
          </div>
        </GlowCard>
      </div>

      <GlowCard innerClassName="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 bg-zinc-900/10">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Ontvangen reacties van bedrijven
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Hier beheer je alle voorstellen van andere bouwbedrijven op deze
              werkpost.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400 font-medium">
              {reacties.length} totaal
            </span>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
              {reactieInAfwachting} open
            </span>
          </div>
        </div>

        {reacties.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <MessageSquare size={28} className="mx-auto mb-3 text-zinc-600" />
            <p className="text-base font-semibold text-zinc-300">
              Nog geen reacties ontvangen
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
              Zodra een ander bouwbedrijf reageert op je post, verschijnt de reactie hier en ontvang je een melding.
            </p>
          </div>
        ) : (
          <div className="space-y-3 bg-zinc-900/10 p-3 sm:p-4">
            {reacties.map((r) => {
              const rMeta = reactieStatusMeta(r.status);
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-white/5 bg-zinc-950/35 p-4 transition-colors hover:border-white/10 hover:bg-white/[0.02] sm:p-5"
                >
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

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {formatAvailabilityRange(
                        r.beschikbaarheid_vanaf,
                        r.beschikbaarheid_tot,
                      ) && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-zinc-400">
                          <CalendarRange size={12} className="text-sky-400" />
                          {formatAvailabilityRange(
                            r.beschikbaarheid_vanaf,
                            r.beschikbaarheid_tot,
                          )}
                        </span>
                      )}
                      {r.voorgesteld_tarief && (
                        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                          Voorgesteld tarief: € {r.voorgesteld_tarief}/u
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 rounded-xl border border-white/5 bg-zinc-950/30 p-3.5 text-sm leading-relaxed text-zinc-300">
                    {r.bericht}
                  </p>

                  {(r.status ?? "in_afwachting") === "in_afwachting" && (
                    <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                          Acties op reactie
                        </p>
                        <p className="text-xs text-zinc-500">
                          Kies meteen om door te pakken of af te wijzen.
                        </p>
                      </div>
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

function DetailTile({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-950/25 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-100">{value}</p>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SideStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>
      <span className="text-sm font-medium text-zinc-200">{value}</span>
    </div>
  );
}

function formatAvailabilityRange(
  vanaf: string | null,
  tot: string | null,
) {
  if (vanaf && tot) {
    return `${formatDate(vanaf)} - ${formatDate(tot)}`;
  }
  if (vanaf) {
    return `Beschikbaar vanaf ${formatDate(vanaf)}`;
  }
  if (tot) {
    return `Beschikbaar tot ${formatDate(tot)}`;
  }
  return null;
}
