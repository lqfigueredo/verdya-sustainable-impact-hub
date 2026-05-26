import { useTranslation } from "react-i18next";

export type Lang = "en" | "pt";

export function useLang(): Lang {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith("pt") ? "pt" : "en";
}
