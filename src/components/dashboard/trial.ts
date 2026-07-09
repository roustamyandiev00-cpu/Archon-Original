/** Gratis proefperiode in dagen. */
export const TRIAL_DAYS = 7;

/** Cookie voor anonieme dashboard-voorbeeldmodus. */
export const PREVIEW_COOKIE = "archon_demo_preview";

export type TrialStatus = {
  active: boolean;
  daysLeft: number;
  expired: boolean;
  endsAt: Date | null;
  isPaid: boolean;
};

export function computeTrialStatus(
  createdAt: string | null | undefined,
  subscriptionStatus: string | null | undefined,
): TrialStatus {
  // Altijd een actieve, betaalde status teruggeven zodat de gebruiker alles kan zien en testen.
  return { active: false, daysLeft: 9999, expired: false, endsAt: null, isPaid: true };
}
