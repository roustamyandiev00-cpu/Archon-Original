export const DASHBOARD_TOUR_DONE_KEY = "archonpro-dashboard-tour-done";
export const NOVA_SPEECH_KEY = "archonpro-nova-speech";
export const ONBOARDING_PROFILE_KEY = "archonpro-onboarding-profile";
export const INTRO_SEEN_KEY = "archonpro-intro-seen-v5";

/** @deprecated Gebruik NOVA_SPEECH_KEY */
export const LANDING_TOUR_SPEECH_KEY = NOVA_SPEECH_KEY;
/** @deprecated Gebruik DASHBOARD_TOUR_DONE_KEY */
export const LANDING_TOUR_DONE_KEY = DASHBOARD_TOUR_DONE_KEY;

export type OnboardingProfile = {
  intent?: string;
  vakgebied?: string;
  teamSize?: string;
  uitdaging?: string;
  doel?: string;
};

export function getOnboardingProfile(): OnboardingProfile {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ONBOARDING_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as OnboardingProfile) : {};
  } catch {
    return {};
  }
}

export function saveOnboardingProfile(patch: Partial<OnboardingProfile>) {
  if (typeof window === "undefined") return;
  const next = { ...getOnboardingProfile(), ...patch };
  localStorage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify(next));
}

export function isDashboardTourDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(DASHBOARD_TOUR_DONE_KEY) === "1";
}

export function markDashboardTourDone() {
  if (typeof window === "undefined") return;
  localStorage.setItem(DASHBOARD_TOUR_DONE_KEY, "1");
}

export function resetDashboardTour() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DASHBOARD_TOUR_DONE_KEY);
}

/** @deprecated Gebruik isDashboardTourDone */
export const isLandingTourDone = isDashboardTourDone;

/** @deprecated Gebruik markDashboardTourDone */
export const markLandingTourDone = markDashboardTourDone;

/** @deprecated Gebruik resetDashboardTour */
export const resetLandingTour = resetDashboardTour;

export function isSpeechEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored =
    localStorage.getItem(NOVA_SPEECH_KEY) ??
    localStorage.getItem("archonpro-landing-tour-speech");
  return stored !== "0";
}

export function setSpeechEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOVA_SPEECH_KEY, enabled ? "1" : "0");
}

export function isIntroSeen(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
}

export function markIntroSeen() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(INTRO_SEEN_KEY, "1");
}

export function resetIntroSeen() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(INTRO_SEEN_KEY);
}
