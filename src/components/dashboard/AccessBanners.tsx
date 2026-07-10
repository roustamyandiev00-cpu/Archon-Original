import Link from "next/link";
import { Eye, Sparkles } from "lucide-react";
import type { TrialStatus } from "@/components/dashboard/trial";
import { stopImpersonationAction } from "@/app/dashboard/admin/impersonation-actions";

const shell =
  "fixed inset-x-0 top-14 z-20 border-b bg-zinc-950/95 backdrop-blur-xl lg:left-[220px]";

export function PreviewBanner() {
  return (
    <div className={`${shell} border-sky-500/20`}>
      <div className="border-b border-sky-500/20 bg-sky-500/10 px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-sky-100">
            <Eye size={15} className="shrink-0 text-sky-300" />
            Je bekijkt een voorbeeld van het ArchonPro-dashboard met demogegevens.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-sky-400"
          >
            <Sparkles size={13} />
            Start 7 dagen gratis
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ImpersonationBanner({ companyName }: { companyName: string }) {
  return (
    <div className={`${shell} border-violet-500/25`}>
      <div className="border-b border-violet-500/25 bg-violet-500/10 px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-violet-100">
            <Eye size={15} className="shrink-0 text-violet-300" />
            Je bekijkt <span className="font-semibold">{companyName}</span> als
            platform-admin — alleen-lezen, wijzigingen zijn uitgeschakeld.
          </p>
          <form action={stopImpersonationAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-violet-400"
            >
              Stop meekijken
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function TrialBanner({ trial }: { trial: TrialStatus }) {
  if (!trial.active || trial.isPaid) return null;

  if (trial.expired) {
    return (
      <div className={`${shell} border-rose-500/25`}>
        <div className="border-b border-rose-500/25 bg-rose-500/10 px-4 py-2.5 sm:px-6">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-rose-100">
              Je gratis proefperiode is verlopen. Kies een abonnement om
              wijzigingen te blijven doen.
            </p>
            <Link
              href="/prijzen"
              className="inline-flex items-center rounded-full bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-400"
            >
              Bekijk abonnementen
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const urgent = trial.daysLeft <= 2;

  return (
    <div
      className={`${shell} ${urgent ? "border-amber-500/25" : "border-sky-500/20"}`}
    >
      <div
        className={`border-b px-4 py-2.5 sm:px-6 ${
          urgent
            ? "border-amber-500/25 bg-amber-500/10"
            : "border-sky-500/20 bg-sky-500/10"
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <p className={`text-sm ${urgent ? "text-amber-100" : "text-sky-100"}`}>
            Gratis proefperiode — nog{" "}
            <span className="font-semibold">
              {trial.daysLeft} {trial.daysLeft === 1 ? "dag" : "dagen"}
            </span>{" "}
            over. Geen creditcard nodig.
          </p>
          <Link
            href="/prijzen"
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              urgent
                ? "bg-amber-500 text-zinc-950 hover:bg-amber-400"
                : "bg-sky-500 text-zinc-950 hover:bg-sky-400"
            }`}
          >
            Abonnement kiezen
          </Link>
        </div>
      </div>
    </div>
  );
}
