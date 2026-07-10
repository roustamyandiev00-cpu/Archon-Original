export type TourIntent =
  | "offertes"
  | "facturatie"
  | "projecten"
  | "overzicht";

export type TourStep = {
  id: string;
  target?: string;
  title: string;
  text: string;
  scrollTo?: string;
};

export const INTENT_OPTIONS: { id: TourIntent; label: string; emoji: string }[] = [
  { id: "offertes", label: "Sneller offertes maken", emoji: "📄" },
  { id: "facturatie", label: "Facturen & betalingen", emoji: "💰" },
  { id: "projecten", label: "Werven & projecten opvolgen", emoji: "🏗️" },
  { id: "overzicht", label: "Alles even bekijken", emoji: "✨" },
];

export function isTourIntent(value: string | undefined): value is TourIntent {
  return INTENT_OPTIONS.some((opt) => opt.id === value);
}
