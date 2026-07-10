import { untyped } from "@/lib/integraties";
import { resolveSlackConnectorUid } from "@/components/dashboard/integraties/slackConnect";

export type SlackSetupStep = {
  id: "workspace" | "channel" | "test";
  label: string;
  done: boolean;
  hint: string;
};

export type SlackSetupStatus = {
  /** Platform (ArchonPro) heeft SLACK_CONNECTOR geconfigureerd. */
  platformReady: boolean;
  workspaceConnected: boolean;
  channelConfigured: boolean;
  testSent: boolean;
  /** Klaar om automatische meldingen te sturen. */
  ready: boolean;
  workspaceName?: string;
  steps: SlackSetupStep[];
};

type ConnRow = {
  status: string;
  config: Record<string, unknown>;
};

export function isSlackPlatformReady() {
  return Boolean(process.env.SLACK_CONNECTOR?.trim());
}

export function evaluateSlackSetup(
  conn?: ConnRow | null,
): SlackSetupStatus {
  const platformReady = isSlackPlatformReady();
  const config = conn?.config ?? {};
  const workspaceConnected =
    conn?.status === "connected" &&
    typeof config.installationId === "string" &&
    config.installationId.trim() !== "";
  const channelConfigured =
    typeof config.notificationChannel === "string" &&
    config.notificationChannel.trim() !== "";
  const testSent = Boolean(config.testSentAt);
  const workspaceName =
    typeof config.workspaceName === "string" ? config.workspaceName : undefined;

  const ready =
    platformReady && workspaceConnected && channelConfigured;

  const steps: SlackSetupStep[] = [
    {
      id: "workspace",
      label: "Slack-workspace koppelen",
      done: workspaceConnected,
      hint: "Installeer de ArchonPro-app in jullie eigen Slack-workspace.",
    },
    {
      id: "channel",
      label: "Meldingenkanaal kiezen",
      done: channelConfigured,
      hint: "Bv. #facturen — hier komen meldingen over nieuwe facturen.",
    },
    {
      id: "test",
      label: "Testmelding versturen",
      done: testSent,
      hint: "Bevestig dat berichten aankomen in jullie kanaal.",
    },
  ];

  return {
    platformReady,
    workspaceConnected,
    channelConfigured,
    testSent,
    ready,
    workspaceName,
    steps,
  };
}

export async function loadSlackSetupStatus(
  supabase: unknown,
  companyId: number,
): Promise<SlackSetupStatus> {
  const { data } = await untyped(supabase)
    .from("integraties")
    .select("status, config")
    .eq("bedrijf_id", companyId)
    .eq("provider", "slack")
    .maybeSingle();

  return evaluateSlackSetup(
    data
      ? {
          status: data.status as string,
          config: (data.config ?? {}) as Record<string, unknown>,
        }
      : null,
  );
}

export function slackCardLabel(status: SlackSetupStatus): {
  label: string;
  tone: "ok" | "warn" | "idle";
} {
  if (!status.platformReady) {
    return { label: "Niet beschikbaar", tone: "idle" };
  }
  if (status.ready) {
    return { label: "Meldingen actief", tone: "ok" };
  }
  if (status.workspaceConnected || status.channelConfigured) {
    return { label: "Setup onvolledig", tone: "warn" };
  }
  return { label: "Niet gekoppeld", tone: "idle" };
}

export function resolveSlackConnectorForCompany(
  config?: Record<string, unknown>,
): string | null {
  if (!isSlackPlatformReady()) return null;
  return resolveSlackConnectorUid(config);
}
