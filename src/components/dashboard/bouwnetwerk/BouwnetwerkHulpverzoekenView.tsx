import Link from "next/link";
import { AlertCircle, HandHelping, MapPin, Plus } from "lucide-react";
import type { HulpverzoekRow } from "@/components/dashboard/bouwnetwerk/load-bouwnetwerk-data";
import GlowCard from "@/components/dashboard/GlowCard";

function formatDeadline(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function HulpverzoekCard({
  item,
  showCompany,
}: {
  item: HulpverzoekRow;
  showCompany?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/30 p-4 transition-colors hover:border-white/15">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-zinc-100">
              {item.titel}
            </h3>
            {item.urgent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                <AlertCircle size={10} />
                Urgent
              </span>
            )}
          </div>
          {showCompany && item.bedrijf_naam && (
            <p className="mt-0.5 text-xs text-zinc-500">{item.bedrijf_naam}</p>
          )}
          <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
            {item.beschrijving}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-500">
          {item.status ?? "open"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
        {item.locatie && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} />
            {item.locatie}
          </span>
        )}
        <span>Deadline: {formatDeadline(item.deadline)}</span>
        <span>{item.aantal_dagen} dagen</span>
      </div>
    </div>
  );
}

export default function BouwnetwerkHulpverzoekenView({
  own,
  network,
}: {
  own: HulpverzoekRow[];
  network: HulpverzoekRow[];
}) {
  return (
    <div className="space-y-6">
      <GlowCard innerClassName="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Mijn hulpverzoeken
          </h2>
          <Link
            href="/bouwnetwerk"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300"
          >
            <Plus size={12} />
            Nieuw verzoek
          </Link>
        </div>
        <div className="space-y-3 p-5">
          {own.length > 0 ? (
            own.map((item) => (
              <HulpverzoekCard key={item.id} item={item} />
            ))
          ) : (
            <div className="grid place-items-center py-12 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-400">
                <HandHelping size={22} />
              </span>
              <p className="mt-3 text-sm text-zinc-500">
                Je hebt nog geen hulpverzoeken geplaatst
              </p>
              <Link
                href="/bouwnetwerk"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/25"
              >
                Hulpverzoek plaatsen
              </Link>
            </div>
          )}
        </div>
      </GlowCard>

      <GlowCard innerClassName="overflow-hidden">
        <div className="border-b border-white/5 px-5 py-3.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Open hulpverzoeken in het netwerk
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Hulpvragen van andere bedrijven waar je op kunt reageren
          </p>
        </div>
        <div className="space-y-3 p-5">
          {network.length > 0 ? (
            network.map((item) => (
              <HulpverzoekCard key={item.id} item={item} showCompany />
            ))
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500">
              Geen open hulpverzoeken in het netwerk op dit moment
            </p>
          )}
        </div>
      </GlowCard>
    </div>
  );
}
