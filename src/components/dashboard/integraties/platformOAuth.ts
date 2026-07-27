import { isPlatformOAuthProvider } from "@/lib/integraties";

export type PlatformOAuthCredentials = {
  clientId: string;
  clientSecret: string;
};

/** Platform OAuth-client credentials per provider (env). */
export function getPlatformOAuthCredentials(
  provider: string,
): PlatformOAuthCredentials | null {
  if (!isPlatformOAuthProvider(provider)) return null;

  const map: Record<string, [string, string]> = {
    "google-calendar": [
      "GOOGLE_CALENDAR_CLIENT_ID",
      "GOOGLE_CALENDAR_CLIENT_SECRET",
    ],
    "microsoft-teams": ["TEAMS_CLIENT_ID", "TEAMS_CLIENT_SECRET"],
    dropbox: ["DROPBOX_CLIENT_ID", "DROPBOX_CLIENT_SECRET"],
    quickbooks: ["QUICKBOOKS_CLIENT_ID", "QUICKBOOKS_CLIENT_SECRET"],
  };

  const keys = map[provider];
  if (!keys) return null;
  const clientId = process.env[keys[0]]?.trim();
  const clientSecret = process.env[keys[1]]?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isPlatformOAuthReady(provider: string): boolean {
  return getPlatformOAuthCredentials(provider) != null;
}

export function platformOAuthConnectLabel(provider: string): string {
  switch (provider) {
    case "google-calendar":
      return "Verbinden met Google";
    case "microsoft-teams":
      return "Verbinden met Microsoft";
    case "dropbox":
      return "Verbinden met Dropbox";
    case "quickbooks":
      return "Verbinden met QuickBooks";
    default:
      return "Verbinden";
  }
}
