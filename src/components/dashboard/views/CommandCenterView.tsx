import Link from "next/link";
import {
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Euro,
  FileText,
  FolderKanban,
  Inbox,
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

function statusMessage(mission: DashboardHomeProps["mission"]) {
  const urgent = mission.important.length + mission.actionItems.length;
  if (urgent > 0) {
    return {
      text: `${urgent} ${urgent === 1 ? "punt vraagt" : "punten vragen"} aandacht`,
      detail: "Bekijk AI Inbox en openstaande taken.",
      tone: "warn" as const,
    };
  }
  if (mission.overdueFacturenCount > 0) {
    return {
      text: `${mission.overdueFacturenCount} vervallen factuur${mission.overdueFacturenCount > 1 ? "en" : ""}`,
      detail: "Stuur herinneringen of plan opvolging.",
      tone: "warn" as const,
    };
  }
  return {
    text: "Geen openstaande aandachtspunten",
    detail: "Geen openstaande offerte-, factuur- of AI-acties.",
    tone: "ok" as const,
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
    <div className="flex min-h-0 flex-col gap-2 lg:h-full lg:gap-2 lg:overflow-hidden">
      <section
        data-tour="dash-status"
        className="shrink-0 rounded-xl border border-white/[0.08] bg-zinc-900/80 p-3 sm:p-3.5"
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                status.tone === "ok"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400"
              }`}
            >
              <CheckCircle2 size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-100">{status.text}</p>
              <p className="mt-0.5 hidden truncate text-xs text-zinc-500 xl:block">
                {status.detail}
              </p>
            </div>
          </div>

          <div
            data-tour="dash-metrics"
            className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:min-w-[360px]"
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
              label="Cashflow"
              value={mission.overdueFacturenCount}
              sublabel={
                mission.overdueFacturenCount > 0 ? "vervallen" : "alles betaald"
              }
              icon={Euro}
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
        className="grid shrink-0 grid-cols-2 gap-1.5 sm:grid-cols-4"
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

      <div className="grid grid-cols-1 gap-2 pb-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-0">
        <DashboardPanel title="AI Command Center" icon={Bot} data-tour="dash-agents">
          <p className="mb-2 text-xs text-zinc-500">
            {DOMAIN_CARD_COUNT} werkgebieden – open een module
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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

        <div className="grid min-h-0 grid-cols-1 gap-2 md:grid-cols-3">
          <DashboardPanel
            title="AI Inbox"
            icon={Bot}
            data-tour="dash-inbox"
          >
            {mission.actionItems.length > 0 ? (
              <ActionItems items={mission.actionItems.slice(0, 2)} demoMode={mission.isDemo} />
            ) : (
              <EmptyState
                icon={Inbox}
                message="Geen AI-acties op dit moment"
                detail="Wanneer agents iets vinden dat aandacht vraagt, verschijnt het hier."
              />
            )}
          </DashboardPanel>

          <DashboardPanel
            title="Mijn Taken"
            icon={Clock}
          >
            {openTasks.length > 0 ? (
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
            ) : (
              <EmptyState
                icon={CheckCircle2}
                message="Nog geen taken voor vandaag"
                detail="Alles afgehandeld of nog niets aangemaakt."
              />
            )}
            <PrimaryButton href="/dashboard/taken" className="mt-3">
              Taken openen
            </PrimaryButton>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href="/dashboard/taken"
                className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/5"
              >
                Nieuwe taak
              </Link>
              <Link
                href="/dashboard/taken?overdue=1"
                className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/5"
              >
                Achterstallig
              </Link>
            </div>
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
              <>
                <p className="text-sm font-medium text-zinc-400">
                  Nog niet genoeg data voor voorspelling
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                  Maak eerst facturen zodat de cashflow op echte gegevens
                  gebaseerd is.
                </p>
                <PrimaryButton href="/dashboard/facturen" className="mt-3">
                  Facturen bekijken
                </PrimaryButton>
              </>
            )}
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
