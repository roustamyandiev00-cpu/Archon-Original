import { getToken } from "@vercel/connect";
import { untyped } from "@/lib/integraties";
import { documentTypeMeta } from "@/lib/facturen";
import {
  resolveSlackConnectorUid,
  slackTokenParams,
} from "@/components/dashboard/integraties/slackConnect";

export type SlackNotifyResult =
  | { sent: true }
  | { skipped: true; reason: string }
  | { failed: true; error: string };

type SlackIntegration = {
  connector: string;
  installationId: string;
  channel: string;
};

function formatEuro(amount: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function dashboardFactuurUrl(factuurId: number) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null);
  const path = `/dashboard/facturen/${factuurId}`;
  return base ? `${base}${path}` : path;
}

async function loadSlackIntegration(
  supabase: unknown,
  companyId: number,
): Promise<SlackIntegration | null> {
  const { data } = await untyped(supabase)
    .from("integraties")
    .select("status, config")
    .eq("bedrijf_id", companyId)
    .eq("provider", "slack")
    .maybeSingle();

  if (data?.status !== "connected") return null;

  const config = (data.config ?? {}) as Record<string, unknown>;
  const connector = resolveSlackConnectorUid(config);
  const installationId =
    typeof config.installationId === "string"
      ? config.installationId.trim()
      : "";
  const channel =
    typeof config.notificationChannel === "string"
      ? config.notificationChannel.trim()
      : "";

  if (!connector || !installationId || !channel) return null;

  return { connector, installationId, channel };
}

/** Stuurt een bericht naar het geconfigureerde Slack-kanaal van het bedrijf. */
export async function sendSlackNotification(
  supabase: unknown,
  companyId: number,
  text: string,
): Promise<SlackNotifyResult> {
  const integration = await loadSlackIntegration(supabase, companyId);
  if (!integration) {
    return {
      skipped: true,
      reason: "Slack niet verbonden of meldingenkanaal niet ingesteld.",
    };
  }

  try {
    const token = await getToken(
      integration.connector,
      slackTokenParams(integration.installationId),
    );
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: integration.channel,
        text,
        unfurl_links: false,
      }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!json.ok) {
      return { failed: true, error: json.error ?? "chat.postMessage mislukt." };
    }
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Slack-melding mislukt.";
    return { failed: true, error: message };
  }
}

/** Melding bij een nieuwe factuur (concept). Faalt stil — blokkeert het aanmaken niet. */
export async function notifySlackNewFactuur(
  supabase: unknown,
  companyId: number,
  factuur: {
    id: number;
    nummer: string;
    klant: string;
    totaal: number;
    documentType: string;
  },
): Promise<SlackNotifyResult> {
  const typeLabel = documentTypeMeta(factuur.documentType).label;
  const url = dashboardFactuurUrl(factuur.id);
  const text = [
    `*Nieuwe ${typeLabel.toLowerCase()} ${factuur.nummer}*`,
    `Klant: ${factuur.klant}`,
    `Totaal: ${formatEuro(factuur.totaal)}`,
    `Status: concept`,
    url.startsWith("http") ? `<${url}|Bekijk in ArchonPro>` : url,
  ].join("\n");

  return sendSlackNotification(supabase, companyId, text);
}

/** Melding wanneer een factuur via Peppol is verzonden. */
export async function notifySlackFactuurVerzonden(
  supabase: unknown,
  companyId: number,
  factuur: {
    id: number;
    nummer: string;
    klant: string;
    totaal: number;
  },
): Promise<SlackNotifyResult> {
  const url = dashboardFactuurUrl(factuur.id);
  const text = [
    `*Factuur ${factuur.nummer} verzonden via Peppol*`,
    `Klant: ${factuur.klant}`,
    `Totaal: ${formatEuro(factuur.totaal)}`,
    url.startsWith("http") ? `<${url}|Bekijk in ArchonPro>` : url,
  ].join("\n");

  return sendSlackNotification(supabase, companyId, text);
}
