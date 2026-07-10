"use client";

import IntegrationsGrid from "@/components/dashboard/integraties/IntegrationsGrid";
import { allSettingsIntegrationProviders } from "@/lib/integraties";

export default function AppIntegrationsPanel({
  connections,
  slackPlatformReady = true,
}: {
  connections: Record<string, { status: string; config: Record<string, unknown> }>;
  slackPlatformReady?: boolean;
}) {
  const providers = allSettingsIntegrationProviders();
  const connectedCount = providers.filter(
    (p) => connections[p.id]?.status === "connected",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Integraties</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Koppel boekhoudsoftware, Peppol, Slack en andere tools.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-400">
          {connectedCount}/{providers.length} verbonden
        </span>
      </div>

      <IntegrationsGrid
        providers={providers}
        connections={connections}
        slackPlatformReady={slackPlatformReady}
      />
    </div>
  );
}
