import Link from "next/link";
import { ArrowLeft, Handshake } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import SamenwerkingenClient, {
  type Samenwerking,
  type AfspraakRow,
} from "@/components/dashboard/werkposts/SamenwerkingenClient";

export const metadata = { title: "Samenwerkingen — ArchonPro" };

type Deelnemers = {
  channel_id?: string | null;
  counterpart_naam?: string | null;
} | null;

export default async function SamenwerkingenPage() {
  const { supabase, companyId } = await getCompanyContext();

  let samenwerkingen: Samenwerking[] = [];
  let afspraken: AfspraakRow[] = [];

  if (companyId) {
    const { data: myMemberships } = await supabase
      .from("bouwnetwerk_channel_members")
      .select("channel_id")
      .eq("company_id", companyId)
      .eq("is_active", true);

    const channelIds = [
      ...new Set(
        (myMemberships ?? [])
          .map((m) => m.channel_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    if (channelIds.length > 0) {
      const { data: channelRows } = await supabase
        .from("bouwnetwerk_channels")
        .select("id, name, werkpost_id, last_message_at")
        .in("id", channelIds)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      const { data: allMembers } = await supabase
        .from("bouwnetwerk_channel_members")
        .select("channel_id, company_id")
        .in("channel_id", channelIds);

      const counterpartByChannel = new Map<string, number>();
      for (const m of allMembers ?? []) {
        if (m.channel_id && m.company_id && m.company_id !== companyId) {
          counterpartByChannel.set(m.channel_id, m.company_id);
        }
      }

      const counterpartIds = [...new Set(counterpartByChannel.values())];
      const naamMap = new Map<number, string>();
      if (counterpartIds.length > 0) {
        const { data: bedrijven } = await supabase
          .from("bedrijven_directory")
          .select("id, naam")
          .in("id", counterpartIds);
        for (const b of bedrijven ?? []) {
          if (b.id != null) naamMap.set(b.id, b.naam ?? `Bedrijf #${b.id}`);
        }
      }

      const werkpostIds = [
        ...new Set(
          (channelRows ?? [])
            .map((c) => c.werkpost_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const titelMap = new Map<string, string>();
      if (werkpostIds.length > 0) {
        const { data: posten } = await supabase
          .from("werkposts")
          .select("id, titel")
          .in("id", werkpostIds);
        for (const p of posten ?? []) titelMap.set(p.id, p.titel);
      }

      samenwerkingen = (channelRows ?? []).map((c) => {
        const counterpartId = counterpartByChannel.get(c.id) ?? null;
        return {
          channelId: c.id,
          counterpartId,
          counterpartNaam: counterpartId
            ? naamMap.get(counterpartId) ?? `Bedrijf #${counterpartId}`
            : c.name ?? "Onbekend",
          werkpostTitel: c.werkpost_id
            ? titelMap.get(c.werkpost_id) ?? null
            : null,
          lastMessageAt: c.last_message_at,
        };
      });

      const { data: afspraakRows } = await supabase
        .from("afspraken")
        .select(
          "id, titel, beschrijving, locatie, start_tijd, eind_tijd, status, deelnemers",
        )
        .eq("bedrijf_id", companyId)
        .eq("type", "bouwnetwerk")
        .order("start_tijd", { ascending: true });

      afspraken = (afspraakRows ?? [])
        .map((a) => {
          const d = a.deelnemers as Deelnemers;
          return {
            id: a.id,
            channelId: d?.channel_id ?? null,
            titel: a.titel,
            beschrijving: a.beschrijving,
            locatie: a.locatie,
            startTijd: a.start_tijd,
            eindTijd: a.eind_tijd,
            status: a.status,
          };
        })
        .filter((a) => a.channelId && channelIds.includes(a.channelId));
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
            <Handshake size={20} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-zinc-50">Samenwerkingen</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Chat, deel documenten en plan afspraken met de bedrijven waarmee je
              een match hebt.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/werkposts"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
        >
          <ArrowLeft size={15} /> Bouwnetwerk
        </Link>
      </header>

      {!companyId ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Je account is nog niet aan een bedrijf gekoppeld. Rond eerst je
          bedrijfsprofiel af via{" "}
          <Link
            href="/dashboard/werkposts"
            className="font-medium underline underline-offset-2 hover:text-amber-200"
          >
            Bouwnetwerk
          </Link>
          .
        </div>
      ) : (
        <SamenwerkingenClient
          samenwerkingen={samenwerkingen}
          afspraken={afspraken}
          companyId={companyId}
        />
      )}
    </div>
  );
}
