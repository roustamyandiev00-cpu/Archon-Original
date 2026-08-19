import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCompanyContext: vi.fn(),
  seedOnboardingFromMetadata: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/company", () => ({
  getCompanyContext: mocks.getCompanyContext,
}));

vi.mock("@/lib/onboarding/seed", () => ({
  seedOnboardingFromMetadata: mocks.seedOnboardingFromMetadata,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { applyOnboardingProfile } from "@/app/dashboard/onboarding-actions";
import {
  classifySignUpResult,
  parseOnboardingProfile,
  parseStoredOnboardingProfile,
} from "@/lib/auth/registration";

describe("registratie en onboardingcontract", () => {
  beforeEach(() => {
    mocks.getCompanyContext.mockReset();
    mocks.seedOnboardingFromMetadata.mockReset();
    mocks.revalidatePath.mockReset();
  });

  it("vereist e-mailbevestiging wanneer signUp een user zonder session geeft", () => {
    expect(
      classifySignUpResult({
        data: { user: { id: "user-id" }, session: null },
        error: null,
      }),
    ).toEqual({ kind: "confirmation_required" });
  });

  it("accepteert geldige onboardingdata inclusief solo en offertes", () => {
    expect(
      parseOnboardingProfile({
        vakgebied: "Renovatie",
        teamSize: "solo",
        uitdaging: "Offertes duren te lang",
        doel: "offertes",
      }),
    ).toEqual({
      success: true,
      data: {
        vakgebied: "Renovatie",
        teamSize: "solo",
        uitdaging: "Offertes duren te lang",
        doel: "offertes",
      },
    });
  });

  it("normaliseert de legacy-uitdaging Offertes", () => {
    expect(
      parseOnboardingProfile({ uitdaging: "Offertes" }),
    ).toEqual({
      success: true,
      data: { uitdaging: "Offertes duren te lang" },
    });
  });

  it("valt voor volledig ongeldige opgeslagen data terug op een leeg profiel", () => {
    expect(
      parseStoredOnboardingProfile({
        vakgebied: 42,
        teamSize: "enterprise",
        uitdaging: "onbekend",
        doel: "alles",
      }),
    ).toEqual({});
  });

  it("weigert ongeldige enums server-side vóór databasegebruik", async () => {
    await expect(
      applyOnboardingProfile({ teamSize: "enterprise", doel: "offertes" }),
    ).resolves.toEqual({ error: "Ongeldig onboardingprofiel." });

    expect(mocks.getCompanyContext).not.toHaveBeenCalled();
    expect(mocks.seedOnboardingFromMetadata).not.toHaveBeenCalled();
  });
});
