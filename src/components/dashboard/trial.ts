/** Gratis proefperiode in dagen. */
export const TRIAL_DAYS = 14;

/** Cookie voor anonieme dashboard-voorbeeldmodus. */
export const PREVIEW_COOKIE = "archon_demo_preview";

/**
 * Statussen die als betaald gelden (geen trial-teller).
 * DB-check: active | trial | past_due | canceled | unpaid
 */
const PAID_STATUSES = new Set(["active", "past_due"]);

export type TrialStatus = {
  active: boolean;
  daysLeft: number;
  expired: boolean;
  endsAt: Date | null;
  isPaid: boolean;
};

function normalizeStatus(status: string | null | undefined): string | null {
  const value = status?.trim().toLowerCase() ?? null;
  return value || null;
}

export function computeTrialStatus(
  createdAt: string | null | undefined,
  subscriptionStatus: string | null | undefined,
): TrialStatus {
  const status = normalizeStatus(subscriptionStatus);

  if (status && PAID_STATUSES.has(status)) {
    return { active: false, daysLeft: 0, expired: false, endsAt: null, isPaid: true };
  }

  // Onbekende niet-trial status (bijv. "free", "starter") telt als betaald,
  // zodat bestaande abonnementlabels niet per ongeluk de trial-gate triggeren.
  if (status && status !== "trial" && status !== "expired") {
    return { active: false, daysLeft: 0, expired: false, endsAt: null, isPaid: true };
  }

  if (status === "expired") {
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
