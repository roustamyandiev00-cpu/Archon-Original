import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  Inbox,
  Plus,
  Receipt,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import ActionItems from "@/components/dashboard/ActionItems";
import type { DashboardHomeProps } from "@/components/dashboard/DashboardHome";
import {
  DashboardPanel,
  EmptyState,
  IconActionButton,
  MetricStat,
  PrimaryButton,
  QuickActionCard,
} from "@/components/dashboard/views/shared";
import { euro } from "@/components/dashboard/mission-data";

type DomainCard = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  stripe: string;
  iconTone: string;
  status: (mission: DashboardHomeProps["mission"]) => string;
};

const domainCards: DomainCard[] = [
  {
    id: "offerte",
    label: "Offerte",
    icon: FileText,
    href: "/dashboard/offertes",
    stripe: "border-l-orange-500",
    iconTone: "text-orange-400 bg-orange-500/10",
    status: (m) =>
      m.offertesCount > 0
        ? `${m.offertesCount} offerte${m.offertesCount > 1 ? "s" : ""} deze maand`
        : "Nog geen offertes deze maand",
  },
  {
    id: "factuur",
    label: "Factuur",
    icon: Receipt,
    href: "/dashboard/facturen",
    stripe: "border-l-orange-500",
    iconTone: "text-orange-400 bg-orange-500/10",
    status: (m) =>
      m.overdueFacturenCount > 0
        ? `${m.overdueFacturenCount} vervallen factuur${m.overdueFacturenCount > 1 ? "en" : ""}`
        : "Geen vervallen facturen",
  },
  {
    id: "project",
    label: "Project",
    icon: FolderKanban,
    href: "/dashboard/offertes/projecten",
    stripe: "border-l-zinc-600",
    iconTone: "text-zinc-400 bg-zinc-800/80",
    status: () => "Projecten en voortgang bekijken",
  },
  {
    id: "klant",
    label: "Klant",
    icon: Users,
    href: "/dashboard/contacten",
    stripe: "border-l-emerald-500",
    iconTone: "text-emerald-400 bg-emerald-500/10",
    status: (m) =>
      m.klantenCount > 0
        ? `${m.klantenCount} klant${m.klantenCount > 1 ? "en" : ""}`
        : "Geen actieve klant",
  },
  {
    id: "planning",
    label: "Planning",
    icon: Calendar,
    href: "/dashboard/agenda",
    stripe: "border-l-orange-500",
    iconTone: "text-orange-400 bg-orange-500/10",
    status: () => "Planning en afspraken bekijken",
  },
  {
    id: "document",
    label: "Document",
    icon: FileText,
    href: "/dashboard/offertes",
    stripe: "border-l-zinc-600",
    iconTone: "text-zinc-400 bg-zinc-800/80",
    status: () => "Offertes en documenten bekijken",
  },
];

function isFreshTenant(mission: DashboardHomeProps["mission"]) {
  return (
    mission.klantenCount === 0 &&
    mission.offertesCount === 0 &&
    mission.gefactureerd === 0 &&
    mission.openstaand === 0 &&
    mission.overdueFacturenCount === 0 &&
    mission.important.length === 0 &&
    mission.tasks.length === 0 &&
    mission.actionItems.length === 0
  );
}

function statusMessage(mission: DashboardHomeProps["mission"]) {
  const aiActionCount = mission.actionItems.length;
  const importantTaskCount = mission.important.length;
  const urgent = importantTaskCount + aiActionCount;
  if (urgent > 0) {
    const hasAiActions = aiActionCount > 0;
    return {
      text: `${urgent} ${urgent === 1 ? "punt vraagt" : "punten vragen"} aandacht`,
      detail: hasAiActions
        ? "Bekijk AI Inbox en openstaande taken."
        : "Bekijk je openstaande taken.",
      tone: "warn" as const,
      nextHref: hasAiActions ? "#dash-inbox" : "/dashboard/taken",
      nextLabel: hasAiActions ? "Naar AI Inbox" : "Taken openen",
    };
  }
  if (mission.overdueFacturenCount > 0) {
    return {
      text: `${mission.overdueFacturenCount} vervallen factuur${mission.overdueFacturenCount > 1 ? "en" : ""}`,
      detail: "Stuur herinneringen of plan opvolging.",
      tone: "warn" as const,
      nextHref: "/dashboard/facturen",
      nextLabel: "Facturen openen",
    };
  }
  if (isFreshTenant(mission)) {
    return {
      text: "Klaar om te starten",
      detail: "Begin met een contact of maak je eerste offerte.",
      tone: "ok" as const,
      nextHref: "/dashboard/contacten",
      nextLabel: "Contact toevoegen",
    };
  }
  return {
    text: "Geen openstaande aandachtspunten",
    detail: "Geen openstaande offerte-, factuur- of AI-acties.",
    tone: "ok" as const,
    nextHref: null as string | null,
    nextLabel: null as string | null,
  };
}

const DOMAIN_CARD_COUNT = domainCards.length;

export default function CommandCenterView({
  mission,
}: Pick<DashboardHomeProps, "mission" | "agentName">) {
  const status = statusMessage(mission);
  const openTasks = [...mission.important, ...mission.tasks].slice(0, 3);
  const hasCashflowData = mission.gefactureerd > 0 || mission.openstaand > 0;
  const attentionCount = mission.important.length + mission.actionItems.length;

  return (
    <div className="flex min-h-0 flex-col gap-3 lg:h-full lg:gap-3 lg:overflow-hidden">
      <section
        data-tour="dash-status"
        className="shrink-0 rounded-xl border border-white/[0.08] bg-zinc-900/80 p-3.5 sm:p-4"
      >
        <div className="grid gap-3.5 2xl:grid-cols-[minmax(220px,1fr)_auto] 2xl:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                status.tone === "ok"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400"
              }`}
            >
              {status.tone === "ok" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertTriangle size={18} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug text-zinc-100">
                {status.text}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {status.detail}
              </p>
              {status.nextHref && status.nextLabel ? (
                <Link
                  href={status.nextHref}
                  className="mt-2 inline-flex text-xs font-medium text-orange-300 transition-colors hover:text-orange-200"
                >
                  {status.nextLabel} →
                </Link>
              ) : null}
            </div>
          </div>

          <div
            data-tour="dash-metrics"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:min-w-[380px]"
          >
            <MetricStat
              label="Contacten"
              value={mission.klantenCount}
              sublabel="actieve contacten"
              icon={Users}
              tone="neutral"
            />
            <MetricStat
              label="Aandacht"
              value={attentionCount}
              sublabel={
                attentionCount > 0 ? "actie nodig" : "geen blokkades"
              }
              icon={Clock}
              tone={attentionCount > 0 ? "warn" : "ok"}
            />
            <MetricStat
              label="Vervallen"
              value={mission.overdueFacturenCount}
              sublabel={
                mission.overdueFacturenCount > 0
                  ? "facturen open"
                  : "geen vervallen"
              }
              icon={AlertTriangle}
              tone={mission.overdueFacturenCount > 0 ? "warn" : "ok"}
            />
            <MetricStat
              label="Offertes"
              value={mission.offertesCount}
              sublabel="deze maand"
              icon={TrendingUp}
              tone="orange"
            />
          </div>
        </div>
      </section>

      <div
        data-tour="dash-actions"
        className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4"
      >
        <QuickActionCard
          title="Contacten"
          subtitle="Klant toevoegen of beheren"
          href="/dashboard/contacten"
          icon={UserPlus}
        />
        <QuickActionCard
          title="Nieuwe Offerte"
          subtitle="Nieuw voorstel"
          href="/dashboard/offertes/nieuw"
          icon={FileText}
        />
        <QuickActionCard
          title="Projecten"
          subtitle="Vanuit een offerte starten"
          href="/dashboard/offertes/projecten"
          icon={FolderKanban}
        />
        <QuickActionCard
          title="Nieuwe Factuur"
          subtitle="Sneller betaald"
          href="/dashboard/facturen/nieuw"
          icon={Receipt}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 pb-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-0">
        <DashboardPanel
          title="AI Command Center"
          icon={Bot}
          data-tour="dash-agents"
        >
          <p className="mb-3 text-xs text-zinc-500">
            {DOMAIN_CARD_COUNT} werkgebieden – open een module
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {domainCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.id}
                  href={card.href}
                  data-tour={
                    card.id === "offerte"
                      ? "dash-agent-offerte"
                      : card.id === "factuur"
                        ? "dash-agent-factuur"
                        : card.id === "project"
                          ? "dash-agent-project"
                          : undefined
                  }
                  className={`flex items-start gap-2.5 rounded-lg border border-white/[0.06] border-l-[3px] bg-zinc-950/50 px-3 py-2.5 transition-colors hover:border-white/12 hover:bg-zinc-950/80 ${card.stripe}`}
                >
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconTone}`}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-100">
                      {card.label}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {card.status(mission)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </DashboardPanel>

        <div className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-3">
          <DashboardPanel
            id="dash-inbox"
            title="AI Inbox"
            icon={Bot}
            data-tour="dash-inbox"
          >
            {mission.actionItems.length > 0 ? (
              <ActionItems
                items={mission.actionItems.slice(0, 2)}
                demoMode={mission.isDemo}
              />
            ) : (
              <EmptyState
                compact
                icon={Inbox}
                message="Geen AI-acties op dit moment"
                detail="Als agents iets vinden dat aandacht vraagt, verschijnt het hier. Start ondertussen met een contact of offerte."
                actionLabel="Eerste offerte"
                actionHref="/dashboard/offertes/nieuw"
                actionVariant="secondary"
              />
            )}
          </DashboardPanel>

          <DashboardPanel
            title="Mijn Taken"
            icon={Clock}
            action={
              <IconActionButton href="/dashboard/taken" label="Taak toevoegen">
                <Plus size={16} />
              </IconActionButton>
            }
          >
            {openTasks.length > 0 ? (
              <>
                <ul className="space-y-1.5">
                  {openTasks.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={task.href}
                        className="block rounded-lg border border-white/[0.05] px-2.5 py-2 transition-colors hover:border-white/12 hover:bg-white/[0.03]"
                      >
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {task.title}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {task.detail}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
                <PrimaryButton href="/dashboard/taken" className="mt-3">
                  Taken openen
                </PrimaryButton>
              </>
            ) : (
              <EmptyState
                compact
                icon={CheckCircle2}
                message="Nog geen taken voor vandaag"
                detail="Maak een taak aan of laat AI er een voorstellen."
                actionLabel="Taak toevoegen"
                actionHref="/dashboard/taken"
              />
            )}
          </DashboardPanel>

          <DashboardPanel title="Cashflow" icon={Wallet}>
            {hasCashflowData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Gefactureerd</span>
                  <span className="font-semibold text-zinc-100">
                    {euro(mission.gefactureerd)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Openstaand</span>
                  <span className="font-semibold text-orange-300">
                    {euro(mission.openstaand)}
                  </span>
                </div>
                <PrimaryButton href="/dashboard/facturen">
                  Facturen bekijken
                </PrimaryButton>
              </div>
            ) : (
              <EmptyState
                compact
                icon={Wallet}
                message="Nog niet genoeg data"
                detail="Maak eerst facturen zodat cashflow op echte bedragen gebaseerd is."
                actionLabel="Facturen bekijken"
                actionHref="/dashboard/facturen"
                actionVariant="secondary"
              />
            )}
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
