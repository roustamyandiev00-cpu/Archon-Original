import Link from "next/link";
import { HardHat, Plus, MessageSquare, Eye, Handshake } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { typeMeta, statusMeta, formatDate, type WerkpostRow } from "@/lib/werkposts";
import GlowCard from "@/components/dashboard/GlowCard";

export const metadata = { title: "Bouwnetwerk — ArchonPro" };

export default async function WerkpostsPage() {
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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
            <HardHat size={20} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-zinc-50">Bouwnetwerk</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Je geplaatste aanvragen en aanbiedingen voor onderaanneming.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/werkposts/samenwerkingen"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
          >
            <Handshake size={16} /> Samenwerkingen
          </Link>
          <Link
            href="/bouwnetwerk"
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
          >
            Publieke pagina
          </Link>
          <Link
            href="/dashboard/werkposts/nieuw"
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400"
          >
            <Plus size={16} /> Nieuwe werkpost
          </Link>
        </div>
      </header>

      {!companyId && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Je account is nog niet aan een bedrijf gekoppeld.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open", value: open },
          { label: "In behandeling", value: inBehandeling },
          { label: "Reacties totaal", value: totaalReacties },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur"
          >
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              {s.label}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-zinc-50">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <GlowCard innerClassName="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Alle werkposts
          </h2>
          <span className="text-xs text-zinc-500">{posts.length} totaal</span>
        </div>

        {posts.length === 0 ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <div className="max-w-sm space-y-3">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-400">
                <HardHat size={22} />
              </span>
              <h3 className="text-base font-semibold text-zinc-100">
                Nog geen werkposts
              </h3>
              <p className="text-sm text-zinc-500">
                Plaats je eerste aanvraag of aanbod voor onderaanneming.
              </p>
              <Link
                href="/dashboard/werkposts/nieuw"
                className="mx-auto mt-1 inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400"
              >
                <Plus size={16} /> Nieuwe werkpost
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3 font-semibold">Titel</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Regio</th>
                  <th className="px-5 py-3 font-semibold">Start</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Reacties</th>
                  <th className="px-5 py-3 text-right font-semibold">Views</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => {
                  const tMeta = typeMeta(p.type);
                  const sMeta = statusMeta(p.status);
                  return (
                    <tr
                      key={p.id}
                      className="group border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/werkposts/${p.id}`}
                          className="font-medium text-sky-400 hover:text-sky-300"
                        >
                          {p.titel}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${tMeta.tone}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${tMeta.dot}`} />
                          {tMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-zinc-300">{p.regio}</td>
                      <td className="px-5 py-3 text-zinc-400">
                        {formatDate(p.startdatum)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${sMeta.tone}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${sMeta.dot}`} />
                          {sMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-zinc-300">
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquare size={13} /> {p.aantal_reacties ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-zinc-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Eye size={13} /> {p.aantal_views ?? 0}
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
