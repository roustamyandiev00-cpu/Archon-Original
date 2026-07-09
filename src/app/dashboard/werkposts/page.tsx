import Link from "next/link";
import { HardHat, Plus, MessageSquare, Eye, Handshake, ShieldAlert, BarChart3 } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { DemoBadge } from "@/components/dashboard/mission";
import { typeMeta, statusMeta, formatDate, type WerkpostRow } from "@/lib/werkposts";
import GlowCard from "@/components/dashboard/GlowCard";

export const metadata = { title: "Bouwnetwerk — ArchonPro" };

export default async function WerkpostsPage() {
  const preview = await isActivePreviewMode();
  const { supabase, companyId } = await getCompanyContext();

  let posts: WerkpostRow[] = [];
  if (companyId) {
    const { data } = await supabase
      .from("werkposts")
      .select(
        "id, titel, beschrijving, aard_van_werk, type, status, urgentie, regio, stad, postcode, adres, aantal_personen, startdatum, einddatum, geschatte_duur_dagen, budget_min, budget_max, tarief_per_uur, tarief_type, vereiste_vaardigheden, company_id, company_naam, created_by_user_id, aantal_reacties, aantal_views, created_at",
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    posts = (data ?? []) as WerkpostRow[];
  }

  const open = posts.filter((p) => p.status === "open").length;
  const inBehandeling = posts.filter((p) => p.status === "in_behandeling").length;
  const totaalReacties = posts.reduce((s, p) => s + (p.aantal_reacties ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/10">
            <HardHat size={22} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Bouwnetwerk</h1>
              {preview && <DemoBadge />}
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              Beheer je geplaatste aanvragen en aanbiedingen voor onderaanneming in de bouw.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/werkposts/samenwerkingen"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/30 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5"
          >
            <Handshake size={16} className="text-sky-400" />
            Samenwerkingen
          </Link>
          <Link
            href="/bouwnetwerk"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/30 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5"
          >
            Publieke feed
          </Link>
          {!preview && (
            <Link
              href="/dashboard/werkposts/nieuw"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-all hover:bg-sky-400 hover:shadow-[0_0_12px_rgba(14,165,233,0.3)]"
            >
              <Plus size={16} /> Nieuwe werkpost
            </Link>
          )}
        </div>
      </header>

      {/* No Company Alert */}
      {!companyId && !preview && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
          <ShieldAlert size={18} className="shrink-0" />
          <div>
            <span className="font-semibold block">Bedrijfsprofiel niet gevonden</span>
            <span className="text-xs text-amber-400/80">
              Je account is nog niet gekoppeld aan een bedrijf. Ga naar de publieke pagina om er een aan te maken.
            </span>
          </div>
        </div>
      )}

      {/* Stat Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Actieve posts", value: open, color: "text-emerald-400" },
          { label: "In behandeling", value: inBehandeling, color: "text-sky-400" },
          { label: "Totaal aantal reacties", value: totaalReacties, color: "text-violet-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/30 p-5 backdrop-blur-sm transition-all hover:border-white/10"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
              {s.label}
            </span>
            <span className={`mt-2 font-mono text-3xl font-bold block ${s.color}`}>
              {s.value}
            </span>
            <span className="absolute bottom-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none">
              <BarChart3 size={48} className="text-white" />
            </span>
          </div>
        ))}
      </div>

      {/* Main Table Container */}
      <GlowCard innerClassName="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 bg-zinc-900/20">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Jouw geplaatste werkposts
          </h2>
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400 font-medium">
            {posts.length} totaal
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="grid place-items-center px-6 py-20 text-center">
            <div className="max-w-md space-y-4">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/10">
                <HardHat size={26} />
              </span>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-zinc-100">
                  Nog geen werkposts geplaatst
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Plaats je eerste aanvraag voor onderaannemers of bied je eigen personeel aan op het Bouwnetwerk.
                </p>
              </div>
              <Link
                href="/dashboard/werkposts/nieuw"
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-sky-400"
              >
                <Plus size={16} /> Eerste werkpost plaatsen
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-900/10 text-left text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                  <th className="px-5 py-3.5">Titel</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Regio</th>
                  <th className="px-5 py-3.5">Startdatum</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Reacties</th>
                  <th className="px-5 py-3.5 text-right">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map((p) => {
                  const tMeta = typeMeta(p.type);
                  const sMeta = statusMeta(p.status);
                  return (
                    <tr
                      key={p.id}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/werkposts/${p.id}`}
                          className="font-semibold text-sky-400 hover:text-sky-300 transition-colors block max-w-xs truncate sm:max-w-sm"
                        >
                          {p.titel}
                        </Link>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tMeta.tone}`}
                        >
                          <span className={`h-1 w-1 rounded-full ${tMeta.dot}`} />
                          {tMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-zinc-300 whitespace-nowrap font-medium">
                        {p.regio}
                      </td>
                      <td className="px-5 py-4 text-zinc-400 whitespace-nowrap font-medium">
                        {formatDate(p.startdatum)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sMeta.tone}`}
                        >
                          <span className={`h-1 w-1 rounded-full ${sMeta.dot}`} />
                          {sMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-zinc-300 font-semibold whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare size={13} className="text-zinc-500 mr-0.5" />
                          {p.aantal_reacties ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-zinc-400 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Eye size={13} className="text-zinc-500 mr-0.5" />
                          {p.aantal_views ?? 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlowCard>
    </div>
  );
}
