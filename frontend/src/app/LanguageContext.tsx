import React, { createContext, useContext, useState, useCallback } from "react";
import { type Language, type MessageKey, t as tRaw, LANGUAGE_OPTIONS } from "./i18n";

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: MessageKey) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("bailens_lang") as Language | null;
    return stored && ["en", "es", "pt", "zh"].includes(stored) ? stored : "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("bailens_lang", lang);
  }, []);

  const t = useCallback(
    (key: MessageKey) => tRaw(language, key),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export { LANGUAGE_OPTIONS };
