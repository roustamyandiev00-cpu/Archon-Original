"use client";

import { useEffect, useRef } from "react";
import { applyOnboardingProfile } from "@/app/dashboard/onboarding-actions";
import {
  getOnboardingProfile,
  saveOnboardingProfile,
} from "@/lib/onboarding/storage";

const APPLIED_KEY = "archonpro-onboarding-applied";

/**
 * Na OAuth-registratie: lees onboarding-antwoorden uit localStorage
 * en schrijf ze door naar het bedrijf (AI-vakgebied/instructies).
 */
export default function OnboardingSeedClient() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(APPLIED_KEY) === "1") return;

    const profile = getOnboardingProfile();
    if (!profile.vakgebied && !profile.uitdaging && !profile.doel) return;

    void applyOnboardingProfile(profile).then((res) => {
      if (res && "ok" in res && res.ok) {
        sessionStorage.setItem(APPLIED_KEY, "1");
        // Bewaar profile maar markeer als toegepast; laat data staan voor tour
        saveOnboardingProfile(profile);
      }
    });
  }, []);

  return null;
}
