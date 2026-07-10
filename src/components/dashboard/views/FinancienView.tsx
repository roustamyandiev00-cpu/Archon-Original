import Link from "next/link";
import { Receipt, ShieldCheck, TrendingUp } from "lucide-react";
import DashboardChartsSection from "@/components/dashboard/DashboardChartsSection";
import type { DashboardHomeProps } from "@/components/dashboard/DashboardHome";
import { euro } from "@/components/dashboard/mission-data";
import {
  DashboardPanel,
  MetricStat,
  PrimaryButton,
} from "@/components/dashboard/views/shared";

export default function FinancienView({
  mission,
  charts,
}: Pick<DashboardHomeProps, "mission" | "charts">) {
  const hasCashflowData = mission.gefactureerd > 0 || mission.openstaand > 0;
  const hasInvoiceIssues =
    mission.overdueFacturenCount > 0 || mission.openstaand > 0;

  return (
    <div className="space-y-5">
      {hasCashflowData && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <MetricStat
            label="Gefactureerd"
            value={euro(mission.gefactureerd)}
            tone="ok"
            icon={TrendingUp}
          />
          <MetricStat
            label="Openstaand"
            value={euro(mission.openstaand)}
            tone={mission.openstaand > 0 ? "warn" : "ok"}
            icon={Receipt}
          />
          <MetricStat
            label="Vervallen"
            value={mission.overdueFacturenCount}
            sublabel={
              mission.overdueFacturenCount > 0 ? "actie nodig" : "geen"
            }
            tone={mission.overdueFacturenCount > 0 ? "warn" : "ok"}
            icon={Receipt}
          />
          <MetricStat
            label="Offertes"
            value={mission.offertesCount}
            tone="orange"
            icon={TrendingUp}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DashboardPanel title="Cashflow" icon={TrendingUp}>
          {hasCashflowData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/10 text-orange-400">
                  <TrendingUp size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    {euro(mission.gefactureerd)} gefactureerd deze maand
                  </p>
                  <p className="text-xs text-zinc-500">
                    {euro(mission.openstaand)} nog openstaand
                  </p>
                </div>
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
              <PrimaryButton href="/dashboard/facturen" className="mt-4">
                Opnieuw controleren
              </PrimaryButton>
            </>
          )}
        </DashboardPanel>

        <DashboardPanel title="BTW-Compliance" icon={ShieldCheck}>
          <p className="text-sm leading-relaxed text-zinc-500">
            Controleer je projecten en offertes op correcte BTW-tarieven
          </p>
          <PrimaryButton href="/dashboard/offertes" className="mt-4">
            Start BTW-controle
          </PrimaryButton>
        </DashboardPanel>
      </div>

      {hasInvoiceIssues && (
        <DashboardPanel
          title="Openstaande facturen"
          icon={Receipt}
          action={
            <Link
              href="/dashboard/facturen"
              className="text-xs font-medium text-orange-400 hover:text-orange-300"
            >
              Alle facturen
            </Link>
          }
        >
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <Receipt size={20} className="text-amber-400" />
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {mission.overdueFacturenCount > 0
                  ? `${mission.overdueFacturenCount} vervallen factuur${mission.overdueFacturenCount > 1 ? "en" : ""}`
                  : "Openstaande betalingen"}
              </p>
              <p className="text-xs text-zinc-500">
                Totaal open: {euro(mission.openstaand)}
              </p>
            </div>
          </div>
        </DashboardPanel>
      )}

      {hasCashflowData && <DashboardChartsSection charts={charts} />}
    </div>
  );
}
