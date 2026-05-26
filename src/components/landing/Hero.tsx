import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/use-lang";
import { ArrowRight, Sparkles, Calendar } from "lucide-react";
import { publicStatsQuery } from "@/lib/landing-stats";
import { upcomingEventsQuery, pickLang } from "@/lib/events";

export function Hero() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: stats } = useQuery(publicStatsQuery);
  const { data: events } = useQuery(upcomingEventsQuery(1));
  const nextEvent = events?.[0] ?? null;

  const statValues = [
    { value: stats?.members ?? 0, label: t("hero.stats.members") },
    { value: stats?.content ?? 0, label: t("hero.stats.content") },
    { value: stats?.upcomingEvents ?? 0, label: t("hero.stats.events") },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute top-20 right-0 h-[520px] w-[520px] rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 md:py-32 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" />
            {t("hero.eyebrow")}
          </span>
          <h1 className="mt-6 font-serif text-5xl font-medium leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
            {t("hero.title")}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("hero.subtitle")}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/library"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition hover:bg-primary/90"
            >
              {t("hero.ctaPrimary")}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground transition hover:border-primary/40"
            >
              {t("hero.ctaSecondary")}
            </Link>
          </div>

          <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-border/60 pt-8">
            {statValues.map((s, i) => (
              <div key={i}>
                <dt className="font-serif text-2xl font-semibold text-foreground">{s.value}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative lg:col-span-5">
          <div className="relative aspect-square w-full max-w-md mx-auto">
            <div className="absolute inset-0 rounded-[42%_58%_38%_62%/55%_45%_55%_45%] bg-gradient-to-br from-primary via-primary to-secondary shadow-glow" />
            <div className="absolute inset-6 rounded-[58%_42%_55%_45%/42%_58%_42%_58%] bg-gradient-to-tr from-accent/80 to-secondary/60 mix-blend-multiply opacity-90" />
            <div className="absolute inset-16 rounded-[40%_60%_60%_40%/60%_40%_60%_40%] bg-background/40 backdrop-blur-sm" />

            {nextEvent ? (
              <Link
                to="/events/$id"
                params={{ id: nextEvent.id }}
                className="absolute bottom-6 right-6 max-w-[260px] rounded-2xl border border-border/80 bg-surface/95 p-4 shadow-soft backdrop-blur-md transition hover:border-primary/40"
              >
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-primary">
                  <Calendar className="h-3 w-3" />
                  {t("hero.nextEvent")}
                </div>
                <p className="mt-2 text-sm font-medium leading-snug text-foreground">
                  {pickLang(nextEvent, "title", lang)}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {new Date(nextEvent.starts_at).toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Link>
            ) : (
              <Link
                to="/events"
                className="absolute bottom-6 right-6 rounded-2xl border border-border/80 bg-surface/95 p-4 shadow-soft backdrop-blur-md transition hover:border-primary/40"
              >
                <p className="text-xs font-medium text-foreground">{t("hero.exploreEvents")}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("hero.exploreEventsHint")}
                </p>
              </Link>
            )}

            <Link
              to="/community"
              className="absolute top-8 left-0 rounded-2xl border border-border/80 bg-surface/95 px-4 py-2.5 shadow-soft backdrop-blur-md transition hover:border-primary/40"
            >
              <p className="text-xs font-medium text-foreground">{t("hero.communityBadge")}</p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
