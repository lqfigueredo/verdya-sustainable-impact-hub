import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/use-lang";
import { ArrowUpRight } from "lucide-react";
import { featuredContentQuery } from "@/lib/landing-stats";
import { pickLang } from "@/lib/library";

export function Featured() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: items, isLoading } = useQuery(featuredContentQuery);

  const gradients = [
    "from-primary/90 to-secondary/70",
    "from-accent/80 to-primary/70",
    "from-secondary/80 to-primary/80",
  ];

  return (
    <section id="content" className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-wider text-accent">
            {t("featured.eyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
            {t("featured.title")}
          </h2>
        </div>
        <Link
          to="/library"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
        >
          {t("featured.viewAll")}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <p className="mt-12 text-sm text-muted-foreground">{t("featured.empty")}</p>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((card, i) => {
            const catName = card.category ? pickLang(card.category, "name", lang) : "";
            return (
              <Link
                key={card.id}
                to="/library/$contentId"
                params={{ contentId: card.id }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-1 hover:shadow-glow"
              >
                {card.cover_image_url ? (
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={card.cover_image_url}
                      alt={pickLang(card, "title", lang)}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className={`aspect-[4/3] bg-gradient-to-br ${gradients[i % gradients.length]} relative`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
                  </div>
                )}
                <div className="relative flex flex-1 flex-col p-6">
                  {catName && (
                    <span className="absolute -top-3 left-6 rounded-full bg-background px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground shadow-soft">
                      {catName}
                    </span>
                  )}
                  <h3 className="mt-2 font-serif text-xl font-medium leading-snug">
                    {pickLang(card, "title", lang)}
                  </h3>
                  <p className="mt-auto pt-6 text-xs uppercase tracking-wider text-muted-foreground">
                    {t(`library.types.${card.type}`)} · {card.reading_time_min} {t("library.minRead")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
