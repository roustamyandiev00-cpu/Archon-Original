type OptionValue<T extends readonly unknown[]> = T[number] extends {
  id: infer Id;
}
  ? Id
  : T[number];

export const ONBOARDING_SECTORS = [
  "Algemene bouw",
  "Renovatie",
  "Dakwerken",
  "Elektriciteit",
  "Sanitair & verwarming",
  "Schilderwerken",
  "Andere",
] as const;

export const ONBOARDING_TEAM_SIZES = [
  { id: "solo", label: "Alleen ik", instructionLabel: "eenmanszaak" },
  { id: "klein", label: "2 – 5 mensen", instructionLabel: "2–5 medewerkers" },
  { id: "middel", label: "6 – 15 mensen", instructionLabel: "6–15 medewerkers" },
  { id: "groot", label: "16+ mensen", instructionLabel: "16+ medewerkers" },
] as const;

export const ONBOARDING_CHALLENGES = [
  "Te veel tijd aan administratie",
  "Offertes duren te lang",
  "Facturen worden te laat betaald",
  "Geen overzicht op werven",
  "Alles zit verspreid in Excel/WhatsApp",
] as const;

export const ONBOARDING_GOALS = [
  { id: "offertes", label: "Sneller offertes maken" },
  { id: "facturatie", label: "Facturatie op orde" },
  { id: "projecten", label: "Werven beter opvolgen" },
  { id: "overzicht", label: "Alles op één plek" },
] as const;

export type OnboardingSector = (typeof ONBOARDING_SECTORS)[number];
export type OnboardingTeamSize = OptionValue<typeof ONBOARDING_TEAM_SIZES>;
export type OnboardingChallenge = (typeof ONBOARDING_CHALLENGES)[number];
export type OnboardingGoal = OptionValue<typeof ONBOARDING_GOALS>;

export type OnboardingProfile = {
  intent?: OnboardingGoal;
  vakgebied?: OnboardingSector;
  teamSize?: OnboardingTeamSize;
  uitdaging?: OnboardingChallenge;
  doel?: OnboardingGoal;
};

type OnboardingParseResult =
  | { success: true; data: OnboardingProfile }
  | { success: false; error: string };

const LEGACY_CHALLENGES: Record<string, OnboardingChallenge> = {
  Offertes: "Offertes duren te lang",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(
  input: Record<string, unknown>,
  key: keyof OnboardingProfile,
): string | undefined | null {
  const value = input[key];
  if (value === undefined || value === null || value === "") return undefined;
  return typeof value === "string" ? value : null;
}

function includes<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}

export function parseOnboardingProfile(input: unknown): OnboardingParseResult {
  if (!isRecord(input)) {
    return { success: false, error: "Ongeldig onboardingprofiel." };
  }

  const vakgebied = optionalString(input, "vakgebied");
  const teamSize = optionalString(input, "teamSize");
  const rawChallenge = optionalString(input, "uitdaging");
  const doel = optionalString(input, "doel");
  const intent = optionalString(input, "intent");
  const uitdaging = rawChallenge
    ? (LEGACY_CHALLENGES[rawChallenge] ?? rawChallenge)
    : undefined;

  if (
    vakgebied === null ||
    teamSize === null ||
    rawChallenge === null ||
    doel === null ||
    intent === null ||
    (vakgebied !== undefined && !includes(ONBOARDING_SECTORS, vakgebied)) ||
    (teamSize !== undefined &&
      !includes(
        ONBOARDING_TEAM_SIZES.map((option) => option.id),
        teamSize,
      )) ||
    (uitdaging !== undefined && !includes(ONBOARDING_CHALLENGES, uitdaging)) ||
    (doel !== undefined &&
      !includes(
        ONBOARDING_GOALS.map((option) => option.id),
        doel,
      )) ||
    (intent !== undefined &&
      !includes(
        ONBOARDING_GOALS.map((option) => option.id),
        intent,
      ))
  ) {
    return { success: false, error: "Ongeldig onboardingprofiel." };
  }

  return {
    success: true,
    data: {
      ...(intent ? { intent } : {}),
      ...(vakgebied ? { vakgebied } : {}),
      ...(teamSize ? { teamSize } : {}),
      ...(uitdaging ? { uitdaging } : {}),
      ...(doel ? { doel } : {}),
    },
  };
}

export function parseStoredOnboardingProfile(input: unknown): OnboardingProfile {
  const result = parseOnboardingProfile(input);
  return result.success ? result.data : {};
}

export function hasOnboardingAnswers(profile: OnboardingProfile): boolean {
  return Boolean(
    profile.vakgebied ||
      profile.teamSize ||
      profile.uitdaging ||
      profile.doel ||
      profile.intent,
  );
}

export function getTeamSizeInstructionLabel(
  teamSize: OnboardingTeamSize,
): string {
  return (
    ONBOARDING_TEAM_SIZES.find((option) => option.id === teamSize)
      ?.instructionLabel ?? teamSize
  );
}

type SignUpResult = {
  data: {
    user: { id: string } | null;
    session: unknown | null;
  };
  error: { message: string } | null;
};

export type SignUpOutcome =
  | { kind: "error"; message: string }
  | { kind: "authenticated"; userId: string }
  | { kind: "confirmation_required" }
  | { kind: "invalid"; message: string };

export function classifySignUpResult(result: SignUpResult): SignUpOutcome {
  if (result.error) return { kind: "error", message: result.error.message };
  if (result.data.user && result.data.session) {
    return { kind: "authenticated", userId: result.data.user.id };
  }
  if (result.data.user && !result.data.session) {
    return { kind: "confirmation_required" };
  }
  return {
    kind: "invalid",
    message: "Account aanmaken is niet gelukt. Probeer opnieuw.",
  };
}
