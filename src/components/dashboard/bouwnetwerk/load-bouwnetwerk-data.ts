import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChannelSummary } from "@/components/dashboard/comms/ChatClient";
import type { WerkpostRow } from "@/lib/werkposts";

export type HulpverzoekRow = {
  id: number;
  titel: string;
  beschrijving: string;
  locatie: string | null;
  status: string | null;
  urgent: boolean | null;
  deadline: string | null;
  start_datum: string | null;
  aantal_dagen: number;
  budget_bedrag: number | null;
  budget_op_aanvraag: boolean | null;
  bedrijf_id: number;
  assigned_to_bedrijf_id: number | null;
  created_at: string | null;
  bedrijf_naam?: string;
};

export type BouwnetwerkData = {
  channels: ChannelSummary[];
  posts: WerkpostRow[];
  hulpverzoeken: HulpverzoekRow[];
  openHulpverzoeken: HulpverzoekRow[];
  pendingReacties: number;
};

export async function loadBouwnetwerkData(
  supabase: SupabaseClient,
  companyId: number | null,
): Promise<BouwnetwerkData> {
  if (!companyId) {
    return {
      channels: [],
      posts: [],
      hulpverzoeken: [],
      openHulpverzoeken: [],
      pendingReacties: 0,
    };
  }

  const [channels, postsRes, ownHulpRes, openHulpRes, myPostsRes] =
    await Promise.all([
      loadChannels(supabase, companyId),
      supabase
        .from("werkposts")
        .select(
          "id, titel, beschrijving, aard_van_werk, type, status, urgentie, regio, stad, postcode, adres, aantal_personen, startdatum, einddatum, geschatte_duur_dagen, budget_min, budget_max, tarief_per_uur, tarief_type, vereiste_vaardigheden, company_id, company_naam, created_by_user_id, aantal_reacties, aantal_views, created_at",
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("hulpverzoeken")
        .select(
          "id, titel, beschrijving, locatie, status, urgent, deadline, start_datum, aantal_dagen, budget_bedrag, budget_op_aanvraag, bedrijf_id, assigned_to_bedrijf_id, created_at",
        )
        .eq("bedrijf_id", companyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("hulpverzoeken")
        .select(
          "id, titel, beschrijving, locatie, status, urgent, deadline, start_datum, aantal_dagen, budget_bedrag, budget_op_aanvraag, bedrijf_id, assigned_to_bedrijf_id, created_at",
        )
        .neq("bedrijf_id", companyId)
        .or("status.eq.open,status.is.null")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("werkposts").select("id").eq("company_id", companyId),
    ]);

  const posts = (postsRes.data ?? []) as WerkpostRow[];
  const myPostIds = (myPostsRes.data ?? []).map((p) => p.id);

  let pendingReacties = 0;
  if (myPostIds.length > 0) {
    const { count } = await supabase
      .from("werkpost_reacties")
      .select("id", { count: "exact", head: true })
      .in("werkpost_id", myPostIds)
      .or("status.eq.in_afwachting,status.is.null");
    pendingReacties = count ?? 0;
  }

  const hulpverzoeken = (ownHulpRes.data ?? []) as HulpverzoekRow[];
  const openHulpverzoeken = (openHulpRes.data ?? []) as HulpverzoekRow[];

  const bedrijfIds = [
    ...new Set(openHulpverzoeken.map((h) => h.bedrijf_id)),
  ];
  if (bedrijfIds.length > 0) {
    const { data: bedrijven } = await supabase
      .from("bedrijven_directory")
      .select("id, naam")
      .in("id", bedrijfIds);
    const naamMap = new Map(
      (bedrijven ?? []).map((b) => [b.id, b.naam ?? `Bedrijf #${b.id}`]),
    );
    for (const h of openHulpverzoeken) {
      h.bedrijf_naam = naamMap.get(h.bedrijf_id);
    }
  }

  return {
    channels,
    posts,
    hulpverzoeken,
    openHulpverzoeken,
    pendingReacties,
  };
}

async function loadChannels(
  supabase: SupabaseClient,
  companyId: number,
): Promise<ChannelSummary[]> {
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

  if (channelIds.length === 0) return [];

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

  return (channelRows ?? []).map((c) => {
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
