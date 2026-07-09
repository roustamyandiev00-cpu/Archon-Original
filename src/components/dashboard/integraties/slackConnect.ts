/** Scopes voor ArchonPro-meldingen in Slack. */
export const SLACK_CONNECT_SCOPES = ["chat:write", "channels:read"] as const;

export function resolveSlackConnectorUid(
  config?: Record<string, unknown>,
): string | null {
  const fromConfig =
    typeof config?.connectorUid === "string" ? config.connectorUid.trim() : "";
  const fromEnv = process.env.SLACK_CONNECTOR?.trim() ?? "";
  return fromConfig || fromEnv || null;
}

export function slackTokenParams(installationId?: string) {
  return {
    subject: { type: "app" as const },
    scopes: [...SLACK_CONNECT_SCOPES],
    ...(installationId ? { installationId } : {}),
  };
}
