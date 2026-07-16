"use client";

import Link from "next/link";
import { Bot, PenLine } from "lucide-react";

export default function NieuweOfferteActions({
  className = "",
  onManueel,
  onAi,
}: {
  className?: string;
  onManueel?: () => void;
  onAi?: () => void;
}) {
  const manueelClass =
    "dashboard-page-action-secondary inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:border-white/25 hover:bg-white/[0.07]";
  const aiClass =
    "dashboard-page-action-primary inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {onManueel ? (
        <button type="button" onClick={onManueel} className={manueelClass}>
          <PenLine size={16} />
          Nieuw manueel
        </button>
      ) : (
        <Link href="/dashboard/offertes/nieuw?mode=manueel" className={manueelClass}>
          <PenLine size={16} />
          Nieuw manueel
        </Link>
      )}
      {onAi ? (
        <button type="button" onClick={onAi} className={aiClass}>
          <Bot size={16} />
          Met AI-agent
        </button>
      ) : (
        <Link href="/dashboard/offertes/nieuw?mode=ai" className={aiClass}>
          <Bot size={16} />
          Met AI-agent
        </Link>
      )}
    </div>
  );
}
