import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage?.startsWith("pt") ? "pt" : "en";
  const next = current === "pt" ? "en" : "pt";

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface/60 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
      aria-label="Toggle language"
    >
      <Languages className="h-3.5 w-3.5" />
      <span className={current === "en" ? "text-foreground" : ""}>EN</span>
      <span className="opacity-30">/</span>
      <span className={current === "pt" ? "text-foreground" : ""}>PT</span>
    </button>
  );
}
