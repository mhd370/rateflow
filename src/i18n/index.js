import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import ar from "./ar.json";

export const LANGUAGE_STORAGE_KEY = "rateflow_lang";

function getInitialLanguage() {
  if (typeof window === "undefined") return "en";

  const saved = String(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || "").trim();
  if (saved === "en" || saved === "ar") return saved;

  const nav = String(window.navigator.language || "").toLowerCase();
  if (nav.startsWith("ar")) return "ar";
  return "en";
}

function applyDocumentDirection(lang) {
  if (typeof document === "undefined") return;

  const isAr = String(lang) === "ar";
  document.documentElement.lang = isAr ? "ar" : "en";
  document.documentElement.dir = isAr ? "rtl" : "ltr";

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, isAr ? "ar" : "en");
  } catch {
    // ignore
  }
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

applyDocumentDirection(i18n.language);
i18n.on("languageChanged", applyDocumentDirection);

export default i18n;

