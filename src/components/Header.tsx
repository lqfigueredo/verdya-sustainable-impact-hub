import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "./LanguageToggle";
import { Leaf } from "lucide-react";

export function Header() {
  const { t } = useTranslation();

  const navItems = [
    { key: "content", href: "/#content" },
    { key: "community", href: "/#community" },
    { key: "resources", href: "/#resources" },
    { key: "about", href: "/#about" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground transition group-hover:rotate-6">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Verdya
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              {t(`nav.${item.key}`)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <LanguageToggle />
          <button className="hidden rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex">
            {t("nav.login")}
          </button>
          <button className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-soft transition hover:bg-primary/90">
            {t("nav.signup")}
          </button>
        </div>
      </div>
    </header>
  );
}
