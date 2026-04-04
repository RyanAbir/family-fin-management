"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "EN" | "BN";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("EN");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedLang = localStorage.getItem("app-language") as Language | null;
    if (storedLang === "EN" || storedLang === "BN") {
      setLanguageState(storedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === "EN" ? "BN" : "EN");
  };

  // Prevent hydration mismatch by avoiding rendering until mounted
  // Actually, we can render English by default and let client patch it to prevent blocking
  if (!mounted) {
    return <LanguageContext.Provider value={{ language: "EN", toggleLanguage, setLanguage }}>{children}</LanguageContext.Provider>;
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
