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
  const isPaid =
    subscriptionStatus != null &&
    subscriptionStatus !== "trial" &&
    subscriptionStatus !== "expired";

  if (isPaid) {
    return { active: false, daysLeft: 0, expired: false, endsAt: null, isPaid: true };
  }

  if (subscriptionStatus === "expired") {
    return { active: true, daysLeft: 0, expired: true, endsAt: null, isPaid: false };
  }

  if (!createdAt) {
    return { active: false, daysLeft: 0, expired: true, endsAt: null, isPaid: false };
  }

  const start = new Date(createdAt);
  const endsAt = new Date(start);
  endsAt.setDate(endsAt.getDate() + TRIAL_DAYS);

  const msLeft = endsAt.getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000));

  return {
    active: true,
    daysLeft,
    expired: msLeft <= 0,
    endsAt,
    isPaid: false,
  };
}
