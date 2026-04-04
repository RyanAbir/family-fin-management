"use client";

import * as React from "react";
import { useLanguage } from "@/context/LanguageContext";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <button className="flex items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all font-bold w-10">
      <span className="text-sm">EN</span>
    </button>
  );

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 font-bold w-10"
      aria-label="Toggle language"
    >
      <span className="text-sm uppercase">{language === "BN" ? "বাংলা" : "EN"}</span>
    </button>
  );
}
