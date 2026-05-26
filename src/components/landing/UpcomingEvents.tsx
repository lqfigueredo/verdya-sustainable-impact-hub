import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Calendar, ArrowRight } from "lucide-react";
import { upcomingEventsQuery, pickLang } from "@/lib/events";

export function UpcomingEvents() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("pt") ? "pt" : "en";
  const { data } = useQuery(upcomingEventsQuery(3));

  if (!data || data.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">{t("events.eyebrow")}</p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
            {t("events.upcomingTitle")}
          </h2>
        </div>
        <Link to="/events" className="hidden items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex">
          {t("events.viewAll")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {data.map((ev) => (
          <Link
            key={ev.id}
            to="/events/$id"
            params={{ id: ev.id }}
            className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-lg"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(ev.starts_at).toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <h3 className="mt-3 font-serif text-xl font-semibold leading-tight group-hover:text-primary">
              {pickLang(ev, "title", lang)}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{pickLang(ev, "description", lang)}</p>
            <span className="mt-4 inline-block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t(`events.location.${ev.location_type}`)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
