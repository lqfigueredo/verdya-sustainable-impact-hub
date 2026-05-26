import { useTranslation } from "react-i18next";
import { GraduationCap, Users, BookOpen } from "lucide-react";

export function WhatIs() {
  const { t } = useTranslation();
  const items = [
    { key: "education", Icon: GraduationCap },
    { key: "networking", Icon: Users },
    { key: "resources", Icon: BookOpen },
  ] as const;

  return (
    <section id="about" className="border-y border-border/60 bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-accent">
            {t("what.eyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
            {t("what.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("what.subtitle")}</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {items.map(({ key, Icon }) => (
            <article
              key={key}
              className="group relative rounded-2xl border border-border bg-background p-8 transition hover:border-primary/30 hover:shadow-soft"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 font-serif text-2xl font-medium">
                {t(`what.items.${key}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t(`what.items.${key}.desc`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
