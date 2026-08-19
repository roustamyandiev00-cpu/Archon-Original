/**
 * Taal- en lettertypeconfiguratie voor ArchonPro.
 * Instellingen worden bewaard in localStorage zodat ze direct zichtbaar zijn.
 */

export type AppLanguage = "nl" | "fr" | "de" | "ru" | "ka" | "en";
export type AppFont =
  | "inter"
  | "geist"
  | "manrope"
  | "plus-jakarta"
  | "dm-sans"
  | "space-grotesk"
  | "outfit";

export const LANGUAGES: { id: AppLanguage; label: string; flag: string; nativeName: string }[] = [
  { id: "nl", label: "Nederlands", flag: "🇧🇪", nativeName: "Nederlands" },
  { id: "fr", label: "Frans", flag: "🇫🇷", nativeName: "Français" },
  { id: "de", label: "Duits", flag: "🇩🇪", nativeName: "Deutsch" },
  { id: "ru", label: "Russisch", flag: "🇷🇺", nativeName: "Русский" },
  { id: "ka", label: "Georgisch", flag: "🇬🇪", nativeName: "ქართული" },
  { id: "en", label: "Engels", flag: "🇬🇧", nativeName: "English" },
];

export const FONTS: {
  id: AppFont;
  label: string;
  description: string;
  cssVar: string;
  googleFamily: string;
}[] = [
  {
    id: "inter",
    label: "Inter",
    description: "Helder & neutraal — standaard",
    cssVar: "var(--font-inter)",
    googleFamily: "Inter",
  },
  {
    id: "geist",
    label: "Geist",
    description: "Modern & technisch",
    cssVar: "var(--font-geist)",
    googleFamily: "Geist",
  },
  {
    id: "manrope",
    label: "Manrope",
    description: "Vriendelijk & leesbaar",
    cssVar: "var(--font-manrope)",
    googleFamily: "Manrope",
  },
  {
    id: "plus-jakarta",
    label: "Plus Jakarta Sans",
    description: "Professioneel & strak",
    cssVar: "var(--font-plus-jakarta)",
    googleFamily: "Plus+Jakarta+Sans",
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    description: "Luchtig & toegankelijk",
    cssVar: "var(--font-dm-sans)",
    googleFamily: "DM+Sans",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    description: "Eigenwijze tech-stijl",
    cssVar: "var(--font-space-grotesk)",
    googleFamily: "Space+Grotesk",
  },
  {
    id: "outfit",
    label: "Outfit",
    description: "Strak & tijdloos",
    cssVar: "var(--font-outfit)",
    googleFamily: "Outfit",
  },
];

export const LANGUAGE_KEY = "archon-language";
export const FONT_KEY = "archon-font";

export function readLanguage(): AppLanguage {
  if (typeof window === "undefined") return "nl";
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (LANGUAGES.some((l) => l.id === stored)) return stored as AppLanguage;
  } catch { /* ignore */ }
  return "nl";
}

export function readFont(): AppFont {
  if (typeof window === "undefined") return "inter";
  try {
    const stored = localStorage.getItem(FONT_KEY);
    if (FONTS.some((f) => f.id === stored)) return stored as AppFont;
  } catch { /* ignore */ }
  return "inter";
}

export function persistLanguage(lang: AppLanguage) {
  try { localStorage.setItem(LANGUAGE_KEY, lang); } catch { /* ignore */ }
}

export function persistFont(font: AppFont) {
  try { localStorage.setItem(FONT_KEY, font); } catch { /* ignore */ }
}

/** Geeft de Google Fonts URL voor een lettertype. */
export function googleFontUrl(font: AppFont): string {
  const meta = FONTS.find((f) => f.id === font);
  if (!meta || font === "inter") return "";
  return `https://fonts.googleapis.com/css2?family=${meta.googleFamily}:wght@300;400;500;600;700;800&display=swap`;
}
