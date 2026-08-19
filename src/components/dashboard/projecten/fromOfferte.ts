import type { OfferteLijnInput } from "@/lib/offertes";

export function projectNameFromOfferte(input: {
  klant: string;
  notes: string;
  lines: OfferteLijnInput[];
  nummer?: string;
  projectNaam?: string | null;
}) {
  if (input.projectNaam?.trim()) return input.projectNaam.trim();

  const fromNotes = input.notes.match(/(?:\[)?Project:\s*([^\n\]]+)/i);
  if (fromNotes?.[1]?.trim()) return fromNotes[1].trim();

  const firstLine = input.lines
    .map((l) => l.omschrijving.trim())
    .find(Boolean);
  if (firstLine) {
    return `${input.klant} — ${firstLine}`.slice(0, 120);
  }

  if (input.nummer) return `${input.klant} — ${input.nummer}`;
  return `Project ${input.klant}`;
}

export function startLabelFromDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("nl-BE", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return new Date().toLocaleDateString("nl-BE", {
      month: "short",
      year: "numeric",
    });
  }
}

export function projectIdFromOfferteType(convertedToType: string | null | undefined) {
  const t = convertedToType ?? "";
  if (t.startsWith("project:")) return t.slice("project:".length);
  return null;
}
