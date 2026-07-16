"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type AppLanguage,
  type AppFont,
  FONTS,
  readLanguage,
  readFont,
  persistLanguage,
  persistFont,
  googleFontUrl,
} from "@/lib/appearance/config";

type AppearanceContextValue = {
  language: AppLanguage;
  font: AppFont;
  setLanguage: (lang: AppLanguage) => void;
  setFont: (font: AppFont) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}

/** Laadt een Google Fonts stylesheet dynamisch in het document. */
function loadGoogleFont(font: AppFont) {
  if (typeof document === "undefined") return;
  const url = googleFontUrl(font);

  // Verwijder eerder geladen externe lettertypes (niet Inter, die is al in layout)
  document.querySelectorAll("link[data-archon-font]").forEach((el) => el.remove());

  if (!url) return; // Inter is al ingebakken via next/font

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.setAttribute("data-archon-font", font);
  document.head.appendChild(link);
}

/** Past het CSS custom-property --font-app aan op het root-element. */
function applyFontToDocument(font: AppFont) {
  if (typeof document === "undefined") return;
  const meta = FONTS.find((f) => f.id === font);
  if (!meta) return;

  // Gebruik de juiste font-family string direct
  const familyMap: Record<AppFont, string> = {
    inter: "Inter, var(--font-inter), sans-serif",
    geist: "Geist, sans-serif",
    manrope: "Manrope, sans-serif",
    "plus-jakarta": "'Plus Jakarta Sans', sans-serif",
    "dm-sans": "'DM Sans', sans-serif",
    "space-grotesk": "'Space Grotesk', sans-serif",
    outfit: "Outfit, sans-serif",
  };

  document.documentElement.style.setProperty(
    "--font-app",
    familyMap[font] ?? "Inter, sans-serif",
  );
}

export default function AppearanceProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("nl");
  const [font, setFontState] = useState<AppFont>("inter");

  // Hydrate from localStorage after mount
  useEffect(() => {
    setLanguageState(readLanguage());
    const storedFont = readFont();
    setFontState(storedFont);
    loadGoogleFont(storedFont);
    applyFontToDocument(storedFont);
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    persistLanguage(lang);
    setLanguageState(lang);
  }, []);

  const setFont = useCallback((f: AppFont) => {
    persistFont(f);
    setFontState(f);
    loadGoogleFont(f);
    applyFontToDocument(f);
  }, []);

  const value = useMemo(
    () => ({ language, font, setLanguage, setFont }),
    [language, font, setLanguage, setFont],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}
