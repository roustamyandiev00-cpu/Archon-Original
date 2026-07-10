/** Zoekt de beste match uit opties op basis van gesproken tekst. */
export function matchSpokenOption(
  spoken: string,
  options: string[],
): string | null {
  const normalized = spoken.toLowerCase().trim();
  if (!normalized) return null;

  const exact = options.find((o) => o.toLowerCase() === normalized);
  if (exact) return exact;

  const contains = options.find(
    (o) =>
      normalized.includes(o.toLowerCase()) ||
      o.toLowerCase().includes(normalized),
  );
  if (contains) return contains;

  const words = normalized.split(/\s+/).filter((w) => w.length > 3);
  for (const word of words) {
    const partial = options.find((o) => o.toLowerCase().includes(word));
    if (partial) return partial;
  }

  return null;
}
