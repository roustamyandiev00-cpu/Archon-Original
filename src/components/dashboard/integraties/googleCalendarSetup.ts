export const GOOGLE_CALENDAR_PROVIDER = "google-calendar";

export function getGoogleCalendarPlatformCredentials(): {
  clientId: string;
  clientSecret: string;
} | null {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isGoogleCalendarPlatformReady(): boolean {
  return getGoogleCalendarPlatformCredentials() != null;
}
