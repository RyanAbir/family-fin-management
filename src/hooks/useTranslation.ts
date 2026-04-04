"use client";

import { useLanguage } from "@/context/LanguageContext";
import { translations, TranslationKey } from "@/lib/i18n/translations";

export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations["EN"][key] || key;
  };

  return { t, language };
}
