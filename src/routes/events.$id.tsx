import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/use-lang";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Calendar, MapPin, Globe2, Users, ArrowLeft, CalendarPlus, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Markdown } from "@/components/Markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { eventByIdQuery, myRegistrationQuery, downloadICS, pickLang, type Speaker } from "@/lib/events";
import { sendEventConfirmation } from "@/lib/email.functions";

export const Route = createFileRoute("/events/$id")({
  component: EventDetailPage,
});

function useCountdown(target: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, done: diff === 0 };
}

function EventDetailPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { data: ev, isLoading } = useQuery(eventByIdQuery(id));
  const { data: registration } = useQuery(myRegistrationQuery(id, user?.id ?? null));
  const sendConfirmation = useServerFn(sendEventConfirmation);
  const [registering, setRegistering] = useState(false);
  const countdown = useCountdown(ev?.starts_at ?? new Date().toISOString());

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        </div>
      </Layout>
    );
  }
  if (!ev) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="text-muted-foreground">{t("events.notFound")}</p>
          <Link to="/events" className="mt-4 inline-block text-primary underline">
            {t("events.backToList")}
          </Link>
        </div>
      </Layout>
    );
  }

  const speakers = (ev.speakers as unknown as Speaker[]) || [];
  const title = pickLang(ev, "title", lang);
  const description = pickLang(ev, "description", lang);
  const isPast = new Date(ev.ends_at).getTime() < Date.now();

  const register = async () => {
    if (!isAuthenticated || !user) {
      navigate({ to: "/login" });
      return;
    }
    setRegistering(true);
    const { error } = await supabase
      .from("event_registrations")
      .insert({ event_id: ev.id, user_id: user.id });
    if (error) {
      toast.error(t("events.registerError"));
    } else {
      toast.success(t("events.registered"));
      qc.invalidateQueries({ queryKey: ["event-registration", ev.id] });
      qc.invalidateQueries({ queryKey: ["my-events"] });
      sendConfirmation({ data: { eventId: ev.id } }).catch(() => {});
    }
    setRegistering(false);
  };

  const cancel = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("event_id", ev.id)
      .eq("user_id", user.id);
    if (error) toast.error(t("events.registerError"));
    else {
      toast.success(t("events.cancelled"));
      qc.invalidateQueries({ queryKey: ["event-registration", ev.id] });
      qc.invalidateQueries({ queryKey: ["my-events"] });
    }
  };

  return (
    <Layout>
      <article className="mx-auto max-w-4xl px-6 py-12">
        <Link to="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("events.backToList")}
        </Link>

        {ev.cover_image_url && (
          <img src={ev.cover_image_url} alt="" className="mt-6 h-64 w-full rounded-2xl object-cover" />
        )}

        <h1 className="mt-8 font-serif text-4xl font-medium tracking-tight md:text-5xl">{title}</h1>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(ev.starts_at).toLocaleString(lang === "pt" ? "pt-BR" : "en-US", {
              dateStyle: "full",
              timeStyle: "short",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            {ev.location_type === "online" ? <Globe2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
            {t(`events.location.${ev.location_type}`)}
            {ev.location_detail && ` · ${ev.location_detail}`}
          </span>
          {ev.max_attendees && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" /> {ev.max_attendees}
            </span>
          )}
        </div>

        {!isPast && (
          <div className="mt-8 grid grid-cols-4 gap-3 rounded-2xl bg-primary/5 p-6">
            {[
              { label: t("events.countdown.days"), v: countdown.d },
              { label: t("events.countdown.hours"), v: countdown.h },
              { label: t("events.countdown.minutes"), v: countdown.m },
              { label: t("events.countdown.seconds"), v: countdown.s },
            ].map((c) => (
              <div key={c.label} className="text-center">
                <div className="font-serif text-3xl font-semibold text-primary md:text-4xl">{c.v}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {!isPast && (registration ? (
            <button
              onClick={cancel}
              className="rounded-full border border-border px-6 py-2.5 text-sm font-medium transition hover:border-destructive hover:text-destructive"
            >
              {t("events.cancel")}
            </button>
          ) : (
            <button
              onClick={register}
              disabled={registering}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {registering && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("events.register")}
            </button>
          ))}
          <button
            onClick={() => downloadICS(ev, lang)}
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium transition hover:border-primary/40"
          >
            <CalendarPlus className="h-4 w-4" /> {t("events.addCalendar")}
          </button>
          {ev.meeting_url && registration && (
            <a
              href={ev.meeting_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-primary px-6 py-2.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              {t("events.join")}
            </a>
          )}
        </div>

        <div className="prose prose-lg mt-12 max-w-none">
          <Markdown>{description}</Markdown>
        </div>

        {speakers.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-medium">{t("events.speakers")}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {speakers.map((sp, i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl border border-border p-4">
                  {sp.avatar_url ? (
                    <img src={sp.avatar_url} alt={sp.name} className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {sp.name?.[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{sp.name}</div>
                    {sp.title && <div className="text-sm text-muted-foreground">{sp.title}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </Layout>
  );
}
