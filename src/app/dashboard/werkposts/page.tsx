import Link from "next/link";
import { Handshake, HardHat, Plus, ShieldAlert } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { isActivePreviewMode } from "@/components/dashboard/context";
import { DemoBadge } from "@/components/dashboard/mission";
import BouwnetwerkHub from "@/components/dashboard/bouwnetwerk/BouwnetwerkHub";
import { loadBouwnetwerkData } from "@/components/dashboard/bouwnetwerk/load-bouwnetwerk-data";
import { BouwnetwerkComingSoonBanner } from "@/components/dashboard/werkposts/BouwnetwerkComingSoonBanner";
import {
  BOUWNETWERK_REQUIRED_USERS,
  fetchPlatformRegistrationCount,
} from "@/lib/bouwnetwerk-gate";

export const metadata = { title: "Bouwnetwerk — ArchonPro" };

export default async function WerkpostsPage() {
  const preview = await isActivePreviewMode();
  const { supabase, companyId } = await getCompanyContext();
  const [data, registeredUsers] = await Promise.all([
    loadBouwnetwerkData(supabase, companyId),
    fetchPlatformRegistrationCount(supabase),
  ]);

  return (
    <div className="dashboard-page flex h-full min-h-0 flex-col gap-2">
      <header className="dashboard-page-header flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-sky-500/10 bg-sky-500/10 text-sky-400">
            <HardHat size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
                Bouwnetwerk
              </h1>
              {preview && <DemoBadge />}
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">
              Chat, werkposts en hulpverzoeken in één overzicht
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/werkposts/samenwerkingen"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
          >
            <Handshake size={15} className="text-sky-400" />
            Samenwerkingen
            {data.pendingReacties > 0 && (
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                {data.pendingReacties}
              </span>
            )}
          </Link>
          {!preview && companyId && (
            <Link
              href="/dashboard/werkposts/nieuw"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400"
            >
              <Plus size={15} />
              Nieuwe werkpost
            </Link>
          )}
        </div>
      </header>

      {!companyId && !preview && (
        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
          <ShieldAlert size={18} className="shrink-0" />
          <div>
            <span className="block font-semibold">Bedrijfsprofiel niet gevonden</span>
            <span className="text-xs text-amber-400/80">
              Koppel je account aan een bedrijf via de{" "}
              <Link href="/bouwnetwerk" className="underline hover:text-amber-200">
                Bouwnetwerk-pagina
              </Link>
              .
            </span>
          </div>
        </div>
      )}

      <BouwnetwerkComingSoonBanner
        registeredUsers={registeredUsers}
        requiredUsers={BOUWNETWERK_REQUIRED_USERS}
      />

      <div className="dashboard-page-content min-h-0 flex-1">
        <BouwnetwerkHub
          {...data}
          companyId={companyId}
          preview={preview}
        />
      </div>
    </div>
  );
}
