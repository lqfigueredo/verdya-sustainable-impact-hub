import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/use-lang";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Globe2, Users } from "lucide-react";
import { Layout } from "@/components/Layout";
import { eventsListQuery, pickLang, type EventFilters, type LocationType } from "@/lib/events";
import { RouteErrorBoundary } from "@/components/RouteBoundary";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Events — Verdya" },
      { name: "description", content: "Live sessions, workshops and networking on corporate sustainability." },
    ],
  }),
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(eventsListQuery({ when: "upcoming" }));
  },
  errorComponent: RouteErrorBoundary,
  component: EventsPage,
});

function EventsPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const [filters, setFilters] = useState<EventFilters>({ when: "upcoming" });
  const { data, isLoading } = useQuery(eventsListQuery(filters));

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">{t("events.eyebrow")}</p>
        <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight md:text-5xl">{t("events.title")}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{t("events.subtitle")}</p>

        <div className="mt-10 flex flex-wrap gap-2">
          {(["upcoming", "past"] as const).map((w) => (
            <button
              key={w}
              onClick={() => setFilters((f) => ({ ...f, when: w }))}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                filters.when === w ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"
              }`}
            >
              {t(`events.when.${w}`)}
            </button>
          ))}
          <span className="mx-2 h-7 w-px bg-border" />
          {([null, "online", "in_person", "hybrid"] as Array<LocationType | null>).map((loc) => (
            <button
              key={loc ?? "all"}
              onClick={() => setFilters((f) => ({ ...f, location: loc }))}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                (filters.location ?? null) === loc ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"
              }`}
            >
              {loc ? t(`events.location.${loc}`) : t("library.filters.all")}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
              ))
            : (data ?? []).map((ev) => (
                <Link
                  key={ev.id}
                  to="/events/$id"
                  params={{ id: ev.id }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg"
                >
                  <div
                    className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20"
                    style={ev.cover_image_url ? { backgroundImage: `url(${ev.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                  >
                    <div className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium backdrop-blur">
                      {new Date(ev.starts_at).toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-serif text-lg font-semibold leading-tight group-hover:text-primary">
                      {pickLang(ev, "title", lang)}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {pickLang(ev, "description", lang)}
                    </p>
                    <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(ev.starts_at).toLocaleTimeString(lang === "pt" ? "pt-BR" : "en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        {ev.location_type === "online" ? <Globe2 className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                        {t(`events.location.${ev.location_type}`)}
                      </span>
                      {ev.max_attendees && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {ev.max_attendees}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
        </div>

        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="mt-12 rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center text-muted-foreground">
            {t("events.empty")}
          </p>
        )}
      </section>
    </Layout>
  );
}
