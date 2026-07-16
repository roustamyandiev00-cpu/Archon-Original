export type AiTokenPackage = {
  id: string;
  name: string;
  tokens: number;
  price: number;
  popular?: boolean;
};

/** Packages shown in Instellingen → AI (Stripe checkout gebruikt dezelfde IDs). */
export const AI_TOKEN_PACKAGES: AiTokenPackage[] = [
  { id: "bronze", name: "Brons (Starter)", tokens: 50_000, price: 9 },
  {
    id: "silver",
    name: "Zilver (Pro)",
    tokens: 250_000,
    price: 29,
    popular: true,
  },
  { id: "gold", name: "Goud (Enterprise)", tokens: 1_000_000, price: 79 },
];

export function getAiTokenPackage(id: string): AiTokenPackage | null {
  return AI_TOKEN_PACKAGES.find((pkg) => pkg.id === id) ?? null;
}
