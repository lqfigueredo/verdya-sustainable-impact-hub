import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "@/locales/en.json";
import pt from "@/locales/pt.json";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        pt: { translation: pt },
      },
      fallbackLng: "en",
      supportedLngs: ["en", "pt"],
      interpolation: { escapeValue: false },
      returnObjects: true,
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "verdya-lang",
      },
    });
}

export default i18n;
