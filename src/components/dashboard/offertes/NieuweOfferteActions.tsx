import Link from "next/link";
import { Bot, PenLine } from "lucide-react";

export default function NieuweOfferteActions({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Link
        href="/dashboard/offertes/nieuw?mode=manueel"
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
      >
        <PenLine size={16} />
        Nieuw manueel
      </Link>
      <Link
        href="/dashboard/offertes/nieuw?mode=ai"
        className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-sky-400"
      >
        <Bot size={16} />
        Met AI-agent
      </Link>
    </div>
  );
}
