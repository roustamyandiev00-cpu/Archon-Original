import { Suspense } from "react";
import { Settings } from "lucide-react";
import { getCompanyContext } from "@/lib/company";
import { loadUserAgentName } from "@/lib/agents/userAi";
import { ensureUserReferral } from "@/lib/referral";
import SettingsForm from "@/components/dashboard/instellingen/SettingsForm";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { parseExtras, DEFAULT_TEMPLATE, type SettingsInput } from "./settings";
import type { ApiKeyInfo } from "@/lib/apiResources";
import {
  integrationConfigForClient,
  untyped,
  type Integratie,
} from "@/lib/integraties";
import {
  isSlackPlatformReady,
  loadSlackSetupStatus,
} from "@/components/dashboard/integraties/slackSetup";
import { GMAIL_SMTP } from "@/components/dashboard/email/smtp-constants";
import type { SmtpSettingsView } from "@/app/dashboard/instellingen/smtp-actions";

export const metadata = { title: "Instellingen — ArchonPro" };

export default async function InstellingenPage() {
  const { supabase, companyId, user } = await getCompanyContext();

  if (!companyId) {
    return (
      <PlaceholderPage
        moduleId="instellingen-empty"
        title="Instellingen"
        description="Beheer je account, bedrijf en voorkeuren."
        icon={<Settings size={20} />}
        features={["Geen actief bedrijf gevonden voor je account."]}
      />
    );
  }

  const { data } = await supabase
    .from("bedrijven")
    .select(
      "naam, adres, postcode, stad, telefoon, email, kvk, btw, iban, peppol_participant_id, logo_url, betaalterm, algemene_voorwaarden, footer_tekst, default_quote_template, default_invoice_template, ai_assistant, verificatiestatus, betrouwbaarheidsscore",
    )
    .eq("id", companyId)
    .maybeSingle();

  const { data: keyRows } = await supabase
    .from("company_api_keys")
    .select("id, name, key_prefix, scopes, last_used_at, created_at, revoked_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  const apiKeys: ApiKeyInfo[] = (keyRows ?? []).map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.key_prefix,
    scopes: k.scopes ?? [],
    lastUsedAt: k.last_used_at,
    createdAt: k.created_at,
    revokedAt: k.revoked_at,
  }));

  const extras = parseExtras(data?.ai_assistant ?? null);
  const userAgentName = user
    ? await loadUserAgentName(supabase, user.id)
    : extras.ai.agentNaam;

  const { data: smtpStatus } = await supabase
    .from("bedrijf_smtp_status")
    .select("*")
    .eq("bedrijf_id", companyId)
    .maybeSingle();

  const smtpInitial: SmtpSettingsView = {
    preset:
      !smtpStatus?.smtp_host || smtpStatus.smtp_host === GMAIL_SMTP.smtp_host
        ? "gmail"
        : "custom",
    smtp_host: smtpStatus?.smtp_host ?? GMAIL_SMTP.smtp_host,
    smtp_port: smtpStatus?.smtp_port ?? GMAIL_SMTP.smtp_port,
    smtp_user: smtpStatus?.smtp_user ?? data?.email ?? "",
    from_email: smtpStatus?.from_email ?? data?.email ?? "",
    from_name: smtpStatus?.from_name ?? data?.naam ?? "",
    hasPassword: Boolean(smtpStatus?.has_password),
    deliveryMode: extras.email?.deliveryMode ?? "mailto",
  };

  const referralCode = user
    ? await ensureUserReferral(supabase, {
        fullName: user.user_metadata?.full_name as string | undefined,
        referredBy: user.user_metadata?.referred_by as string | undefined,
      })
    : null;

  const { data: integrationRows } = await untyped(supabase)
    .from("integraties")
    .select("provider, status, config")
    .eq("bedrijf_id", companyId);

  const integrationConnections = Object.fromEntries(
    ((integrationRows ?? []) as Pick<Integratie, "provider" | "status" | "config">[]).map(
      (c) => [
        c.provider,
        { status: c.status, config: integrationConfigForClient(c.config) },
      ],
    ),
  );

  const slackSetup = await loadSlackSetupStatus(supabase, companyId);
  const slackSetupIncomplete =
    Boolean(slackSetup?.platformReady) && !slackSetup?.ready;

  const initial: SettingsInput = {
    naam: data?.naam ?? "",
    adres: data?.adres ?? "",
    postcode: data?.postcode ?? "",
    stad: data?.stad ?? "",
    telefoon: data?.telefoon ?? "",
    email: data?.email ?? "",
    kvk: data?.kvk ?? "",
    btw: data?.btw ?? "",
    iban: data?.iban ?? "",
    peppol_participant_id: data?.peppol_participant_id ?? "",
    logo_url: data?.logo_url ?? "",
    betaalterm: data?.betaalterm ?? 30,
    standaardBtw: extras.standaardBtw,
    algemene_voorwaarden: data?.algemene_voorwaarden ?? "",
    footer_tekst: data?.footer_tekst ?? "",
    quoteTemplate: data?.default_quote_template || DEFAULT_TEMPLATE,
    invoiceTemplate: data?.default_invoice_template || DEFAULT_TEMPLATE,
    ai: { ...extras.ai, agentNaam: userAgentName },
    incasso: extras.incasso ?? { deurwaarderEmail: "" },
  };

  return (
    <div className="mx-auto h-full min-h-0 w-full max-w-[1100px] space-y-3 overflow-y-auto overscroll-contain pb-2 pr-1 [scrollbar-gutter:stable]">
      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
          <Settings size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Instellingen</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Beheer je bedrijfsgegevens, documenten, integraties en de AI-agent.
          </p>
        </div>
      </header>

      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white/5" />}>
        <SettingsForm
          initial={initial}
          smtpInitial={smtpInitial}
          apiKeys={apiKeys}
          referralCode={referralCode}
          integrationConnections={integrationConnections}
          slackPlatformReady={isSlackPlatformReady()}
          slackSetupIncomplete={slackSetupIncomplete}
          verificatiestatus={data?.verificatiestatus ?? "onbevestigd"}
          betrouwbaarheidsscore={
            typeof data?.betrouwbaarheidsscore === "number"
              ? data.betrouwbaarheidsscore
              : null
          }
        />
      </Suspense>
    </div>
  );
}
