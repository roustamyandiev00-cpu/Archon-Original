"use client";

import Link from "next/link";
import { ChevronRight, Plug } from "lucide-react";
import IntegrationsGrid from "@/components/dashboard/integraties/IntegrationsGrid";
import { APP_INTEGRATION_PROVIDERS } from "@/lib/integraties";

export default function AppIntegrationsPanel({
  connections,
  slackPlatformReady = true,
}: {
  connections: Record<string, { status: string; config: Record<string, unknown> }>;
  slackPlatformReady?: boolean;
}) {
  const connectedCount = APP_INTEGRATION_PROVIDERS.filter(
    (p) => connections[p.id]?.status === "connected",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">App integraties</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Voer je eigen API-sleutels in om koppelingen te activeren.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-400">
          {connectedCount}/{APP_INTEGRATION_PROVIDERS.length} verbonden
        </span>
      </div>

      <IntegrationsGrid
        providers={APP_INTEGRATION_PROVIDERS}
        connections={connections}
        slackPlatformReady={slackPlatformReady}
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <p className="text-sm text-zinc-400">
          Zoek je Peppol, Billit of boekhoudkoppelingen? Die staan op de aparte
          integratiepagina.
        </p>
        <Link
          href="/dashboard/integraties"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sky-400 hover:text-sky-300"
        >
          <Plug size={14} />
          Alle integraties bekijken
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
