import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import {
  mapSamenwerkingContractRow,
  type SamenwerkingContractRow,
} from "@/lib/werkposts/contracts";
import SamenwerkingenClient, {
  type Samenwerking,
  type AfspraakRow,
  type PendingReactie,
} from "@/components/dashboard/werkposts/SamenwerkingenClient";
import { BouwnetwerkComingSoonBanner } from "@/components/dashboard/werkposts/BouwnetwerkComingSoonBanner";
import { hasAcceptedCurrentChatTerms } from "@/lib/bouwnetwerk/chat-terms";

export const metadata = { title: "Samenwerkingen — ArchonPro" };

type Deelnemers = {
  channel_id?: string | null;
  counterpart_naam?: string | null;
} | null;

function messagePreview(
  content: string | null,
  attachments: unknown,
  type: string | null,
): string {
  if (Array.isArray(attachments) && attachments.length > 0) {
    const first = attachments[0] as { isImage?: boolean; name?: string };
    if (first?.isImage) return "📷 Foto";
    return `📎 ${first?.name ?? "Document"}`;
  }
  if (!content) return type === "text" ? "" : "Bericht";
  if (content.startsWith("{")) {
    try {
      const rich = JSON.parse(content) as {
        text?: string;
        audioUrl?: string;
        callType?: string;
      };
      if (rich.audioUrl) return "🎤 Spraakbericht";
      if (rich.callType) return rich.callType === "video-oproep" ? "📹 Video-oproep" : "📞 Spraakoproep";
      if (rich.text) return rich.text;
    } catch {
      /* plain text fallback */
    }
  }
  return content.replace(/\s+/g, " ").trim();
}

export default async function SamenwerkingenPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const { channel: initialChannelId } = await searchParams;
  const { supabase, companyId, user } = await getCompanyContext();
  const { data: registrationCount } = await supabase.rpc(
    "get_platform_registration_count",
  );

  let samenwerkingen: Samenwerking[] = [];
  let afspraken: AfspraakRow[] = [];
  let myReviews: { target_company_id: number; rating: number; commentaar: string }[] = [];
  const counterpartRatings: Record<number, { avg: number; count: number }> = {};
  let pendingReacties: PendingReactie[] = [];
  const contractsByChannel: Record<string, SamenwerkingContractRow> = {};
  const companyNames: Record<number, string> = {};
  let chatTermsAccepted = false;

  if (companyId) {
    if (user) {
      const { data: membership } = await supabase
        .from("company_memberships")
        .select("chat_terms_accepted_at, chat_terms_version")
        .eq("company_id", companyId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      chatTermsAccepted = hasAcceptedCurrentChatTerms({
        acceptedAt: membership?.chat_terms_accepted_at,
        version: membership?.chat_terms_version,
      });
    }

    const { data: myBedrijf } = await supabase
      .from("bedrijven_directory")
      .select("id, naam")
      .eq("id", companyId)
      .maybeSingle();
    if (myBedrijf?.id != null) {
      companyNames[myBedrijf.id] = myBedrijf.naam ?? `Bedrijf #${myBedrijf.id}`;
    }

    const { data: myPosts } = await supabase
      .from("werkposts")
      .select("id, titel")
      .eq("company_id", companyId);

    const myPostIds = (myPosts ?? []).map((p) => p.id);
    if (myPostIds.length > 0) {
      const { data: pendingRows } = await supabase
        .from("werkpost_reacties")
        .select("id, werkpost_id, company_id, status")
        .in("werkpost_id", myPostIds)
        .or("status.eq.in_afwachting,status.is.null");

      const pendingCompanyIds = [
        ...new Set((pendingRows ?? []).map((r) => r.company_id)),
      ];
      const pendingNaamMap = new Map<number, string>();
      if (pendingCompanyIds.length > 0) {
        const { data: pendingBedrijven } = await supabase
          .from("bedrijven_directory")
          .select("id, naam")
          .in("id", pendingCompanyIds);
        for (const b of pendingBedrijven ?? []) {
          if (b.id != null) {
            pendingNaamMap.set(b.id, b.naam ?? `Bedrijf #${b.id}`);
          }
        }
      }

      const titelByPostId = new Map(
        (myPosts ?? []).map((p) => [p.id, p.titel]),
      );

      pendingReacties = (pendingRows ?? []).map((r) => ({
        id: r.id,
        werkpostId: r.werkpost_id,
        werkpostTitel: titelByPostId.get(r.werkpost_id) ?? "Werkpost",
        companyNaam:
          pendingNaamMap.get(r.company_id) ?? `Bedrijf #${r.company_id}`,
      }));
    }

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
          if (b.id != null) {
            naamMap.set(b.id, b.naam ?? `Bedrijf #${b.id}`);
            companyNames[b.id] = b.naam ?? `Bedrijf #${b.id}`;
          }
        }

        // Reviews van de ingelogde gebruiker ophalen.
        const { data: myReviewsData } = await supabase
          .from("bedrijf_reviews")
          .select("target_company_id, rating, commentaar")
          .eq("reviewer_company_id", companyId)
          .in("target_company_id", counterpartIds);
        myReviews = (myReviewsData ?? [])
          .filter(
            (
              review,
            ): review is {
              target_company_id: number;
              rating: number;
              commentaar: string;
            } =>
              typeof review.target_company_id === "number" &&
              typeof review.rating === "number",
          )
          .map((review) => ({
            target_company_id: review.target_company_id,
            rating: review.rating,
            commentaar: review.commentaar ?? "",
          }));

        // Reviews stats van de partners ophalen.
        const { data: counterpartReviewsData } = await supabase
          .from("bedrijf_reviews")
          .select("target_company_id, rating")
          .in("target_company_id", counterpartIds);

        if (counterpartReviewsData) {
          const totals = new Map<number, { sum: number; count: number }>();
          for (const r of counterpartReviewsData) {
            const current = totals.get(r.target_company_id) ?? { sum: 0, count: 0 };
            totals.set(r.target_company_id, {
              sum: current.sum + r.rating,
              count: current.count + 1,
            });
          }
          for (const [cid, val] of totals.entries()) {
            counterpartRatings[cid] = {
              avg: Math.round((val.sum / val.count) * 10) / 10,
              count: val.count,
            };
          }
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
          werkpostId: c.werkpost_id ?? null,
          werkpostTitel: c.werkpost_id
            ? titelMap.get(c.werkpost_id) ?? null
            : null,
          lastMessageAt: c.last_message_at,
          lastMessagePreview: null as string | null,
        };
      });

      const { data: recentMessages } = await supabase
        .from("bouwnetwerk_messages")
        .select("channel_id, content, type, attachments, created_at")
        .in("channel_id", channelIds)
        .order("created_at", { ascending: false })
        .limit(250);

      const previewByChannel = new Map<string, string>();
      for (const msg of recentMessages ?? []) {
        if (!msg.channel_id || previewByChannel.has(msg.channel_id)) continue;
        const preview = messagePreview(msg.content, msg.attachments, msg.type);
        if (preview) previewByChannel.set(msg.channel_id, preview);
      }

      samenwerkingen = samenwerkingen.map((s) => ({
        ...s,
        lastMessagePreview: previewByChannel.get(s.channelId) ?? null,
      }));

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

      const { data: contractRows } = await supabase
        .from("samenwerking_contracts")
        .select("*")
        .in("channel_id", channelIds)
        .neq("status", "void");

      for (const row of contractRows ?? []) {
        if (row.channel_id) {
          contractsByChannel[row.channel_id] = mapSamenwerkingContractRow(
            row as Record<string, unknown>,
          );
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/werkposts"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
        >
          <ArrowLeft size={15} /> Bouwnetwerk
        </Link>
        <p className="text-xs text-zinc-500">
          Chat met partners waarmee je een match hebt
        </p>
      </div>

      <BouwnetwerkComingSoonBanner
        currentUsers={Number(registrationCount ?? 0)}
      />

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
          myReviews={myReviews}
          counterpartRatings={counterpartRatings}
          pendingReacties={pendingReacties}
          initialChannelId={initialChannelId ?? null}
          contractsByChannel={contractsByChannel}
          companyNames={companyNames}
          chatTermsAccepted={chatTermsAccepted}
        />
      )}
    </div>
  );
}
