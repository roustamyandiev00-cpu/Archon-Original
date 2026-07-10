"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  ExternalLink,
  HardHat,
  MessageSquare,
  Plus,
} from "lucide-react";
import GlowCard from "@/components/dashboard/GlowCard";
import WerkpostForm from "@/components/werkposts/WerkpostForm";
import {
  formatDate,
  statusMeta,
  typeMeta,
  type WerkpostRow,
} from "@/lib/werkposts";

export default function BouwnetwerkWerkpostsView({
  posts,
  preview,
}: {
  posts: WerkpostRow[];
  preview: boolean;
}) {
  const router = useRouter();
  const open = posts.filter((p) => p.status === "open").length;
  const inBehandeling = posts.filter((p) => p.status === "in_behandeling").length;
  const totaalReacties = posts.reduce((s, p) => s + (p.aantal_reacties ?? 0), 0);

  return (
    <div className="space-y-5">
      {!preview && (
        <div id="plaatsen-werkpost">
          <GlowCard innerClassName="p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Werkpost plaatsen
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Zichtbaar op de publieke{" "}
                <Link
                  href="/bouwnetwerk"
                  className="inline-flex items-center gap-0.5 font-medium text-sky-400 hover:text-sky-300"
                >
                  Bouwnetwerk-feed
                  <ExternalLink size={12} />
                </Link>
                , net als op de community-pagina.
              </p>
            </div>
          </div>
          <WerkpostForm
            embedded
            onCreated={() => router.refresh()}
          />
          </GlowCard>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Actieve posts", value: open, color: "text-emerald-400" },
          { label: "In behandeling", value: inBehandeling, color: "text-sky-400" },
          { label: "Totaal reacties", value: totaalReacties, color: "text-violet-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/10 bg-zinc-900/40 p-4"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {s.label}
            </span>
            <span className={`mt-1 block font-mono text-2xl font-bold ${s.color}`}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <GlowCard innerClassName="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5 bg-zinc-900/20">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Jouw geplaatste werkposts
          </h2>
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
            {posts.length} totaal
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <div className="max-w-md space-y-4">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/10">
                <HardHat size={22} />
              </span>
              <div>
                <h3 className="text-base font-semibold text-zinc-100">
                  Nog geen werkposts
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Plaats je eerste aanvraag voor onderaannemers of bied personeel
                  aan op het Bouwnetwerk.
                </p>
              </div>
              {!preview && (
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("plaatsen-werkpost")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400"
                >
                  <Plus size={16} /> Eerste werkpost plaatsen
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-900/10 text-left text-xs uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3">Titel</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Regio</th>
                  <th className="px-5 py-3">Start</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Reacties</th>
                  <th className="px-5 py-3 text-right">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map((p) => {
                  const tMeta = typeMeta(p.type);
                  const sMeta = statusMeta(p.status);
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/werkposts/${p.id}`}
                          className="block max-w-xs truncate font-semibold text-sky-400 hover:text-sky-300 sm:max-w-sm"
                        >
                          {p.titel}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${tMeta.tone}`}
                        >
                          {tMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-300">{p.regio}</td>
                      <td className="px-5 py-3.5 text-zinc-400">
                        {formatDate(p.startdatum)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${sMeta.tone}`}
                        >
                          {sMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-zinc-300">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare size={13} className="text-zinc-500" />
                          {p.aantal_reacties ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <Eye size={13} className="text-zinc-500" />
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
