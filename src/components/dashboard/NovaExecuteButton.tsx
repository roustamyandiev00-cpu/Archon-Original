"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function NovaExecuteButton({
  hasActions,
}: {
  hasActions: boolean;
}) {
  if (!hasActions) return null;

  return (
    <Link
      href="/dashboard/automatisaties"
      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3.5 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-sky-400"
    >
      <Sparkles size={13} /> Voorstel uitvoeren
    </Link>
  );
}
