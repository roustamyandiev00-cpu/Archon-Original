import { MessageCircle } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import ChatClient, { type ChannelSummary } from "@/components/dashboard/comms/ChatClient";

export const metadata = { title: "Comms — ArchonPro" };

export default async function CommsPage() {
  const { supabase, companyId } = await getCompanyContext();

  let channels: ChannelSummary[] = [];

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

      channels = (channelRows ?? []).map((c) => {
        const counterpartId = counterpartByChannel.get(c.id);
        return {
          id: c.id,
          name: c.name,
          werkpostId: c.werkpost_id,
          werkpostTitel: c.werkpost_id ? titelMap.get(c.werkpost_id) ?? null : null,
          lastMessageAt: c.last_message_at,
          counterpartNaam: counterpartId
            ? naamMap.get(counterpartId) ?? `Bedrijf #${counterpartId}`
            : (c.name ?? "Onbekend"),
        };
      });
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
          <MessageCircle size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Comms</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Chat met bedrijven waarmee je een match hebt via Bouwnetwerk.
          </p>
        </div>
      </header>

      {!companyId ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Je account is nog niet aan een bedrijf gekoppeld.
        </div>
      ) : (
        <ChatClient channels={channels} companyId={companyId} />
      )}
    </div>
  );
}
