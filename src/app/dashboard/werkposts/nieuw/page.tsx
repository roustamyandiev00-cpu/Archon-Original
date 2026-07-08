import Link from "next/link";
import { ArrowLeft, HardHat } from "lucide-react";
import WerkpostForm from "@/components/werkposts/WerkpostForm";
import GlowCard from "@/components/dashboard/GlowCard";

export const metadata = { title: "Nieuwe werkpost — ArchonPro" };

export default function NieuweWerkpostPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/dashboard/werkposts"
        className="group inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <ArrowLeft
          size={15}
          className="transition-transform group-hover:-translate-x-0.5"
        />
        Terug naar Bouwnetwerk
      </Link>

      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
          <HardHat size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Nieuwe werkpost</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Wordt meteen zichtbaar op de publieke Bouwnetwerk-pagina.
          </p>
        </div>
      </header>

      <GlowCard innerClassName="p-5 sm:p-6">
        <WerkpostForm />
      </GlowCard>
    </div>
  );
}
