import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/use-lang";
import { Calendar, BookOpen, MessageSquare, Bell, ArrowRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { myEventsQuery, pickLang as pickEventLang } from "@/lib/events";
import { favoritesQuery, pickLang } from "@/lib/library";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Verdya" },
      { name: "description", content: "Seu painel pessoal na Verdya." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  ),
});

function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language?.startsWith("pt") ? "pt" : "en";
  const userId = user?.id ?? null;
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  const myEvents = useQuery(myEventsQuery(userId));
  const myFavoriteIds = useQuery(favoritesQuery(userId));

  const favorites = useQuery({
    queryKey: ["dashboard-favorites", myFavoriteIds.data],
    enabled: !!myFavoriteIds.data && myFavoriteIds.data.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("content_items")
        .select("id,title_en,title_pt,type,reading_time_min")
        .in("id", myFavoriteIds.data!)
        .limit(5);
      return data ?? [];
    },
  });

  const notifications = useQuery({
    queryKey: ["dashboard-notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId!)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const upcomingRegs = (myEvents.data ?? []).filter(
    (r) => r.event && new Date(r.event.starts_at) >= new Date(),
  );

  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-accent">
              {t("dashboard.eyebrow")}
            </p>
            <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight">
              {t("dashboard.greeting", { name: name.split(" ")[0] })}
            </h1>
            <p className="mt-2 text-muted-foreground">{t("dashboard.subtitle")}</p>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 rounded-full border border-input bg-surface px-4 py-2 text-sm transition hover:border-primary/40"
          >
            {t("dashboard.editProfile")}
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Upcoming events */}
          <Card icon={Calendar} title={t("dashboard.myEvents")} cta={{ to: "/events", label: t("dashboard.browseEvents") }}>
            {myEvents.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : upcomingRegs.length === 0 ? (
              <Empty text={t("dashboard.empty.events")} />
            ) : (
              <ul className="divide-y">
                {upcomingRegs.slice(0, 4).map((r) => (
                  <li key={r.id} className="py-3">
                    <Link
                      to="/events/$id"
                      params={{ id: r.event!.id }}
                      className="block hover:text-primary"
                    >
                      <p className="text-sm font-medium">{pickEventLang(r.event!, "title", lang)}</p>
                      <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                        {new Date(r.event!.starts_at).toLocaleString(lang === "pt" ? "pt-BR" : "en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Favorites */}
          <Card icon={BookOpen} title={t("dashboard.favorites")} cta={{ to: "/library", label: t("dashboard.browseLibrary") }}>
            {favorites.isLoading || myFavoriteIds.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !favorites.data || favorites.data.length === 0 ? (
              <Empty text={t("dashboard.empty.favorites")} />
            ) : (
              <ul className="divide-y">
                {favorites.data.map((c) => (
                  <li key={c.id} className="py-3">
                    <Link
                      to="/library/$contentId"
                      params={{ contentId: c.id }}
                      className="block hover:text-primary"
                    >
                      <p className="text-sm font-medium">{pickLang(c, "title", lang)}</p>
                      <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                        {t(`library.types.${c.type}`)} · {c.reading_time_min} {t("library.minRead")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Notifications */}
          <Card icon={Bell} title={t("dashboard.notifications")} cta={{ to: "/community", label: t("dashboard.openCommunity") }}>
            {notifications.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !notifications.data || notifications.data.length === 0 ? (
              <Empty text={t("dashboard.empty.notifications")} />
            ) : (
              <ul className="divide-y">
                {notifications.data.map((n) => (
                  <li key={n.id} className="py-3">
                    <p className="text-sm">{t(`forum.notifications.types.${n.type}`)}</p>
                    <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                      {new Date(n.created_at).toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Community shortcut */}
          <Card icon={MessageSquare} title={t("dashboard.community")} cta={{ to: "/community/new", label: t("dashboard.startDiscussion") }}>
            <p className="text-sm text-muted-foreground">{t("dashboard.communityDesc")}</p>
            <Link
              to="/community"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t("dashboard.exploreDiscussions")} <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </div>
      </section>
    </Layout>
  );
}

function Card({
  icon: Icon,
  title,
  cta,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  cta?: { to: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="font-serif text-lg font-medium">{title}</h2>
        </div>
        {cta && (
          <Link to={cta.to} className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground">
            {cta.label}
          </Link>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-3 text-sm text-muted-foreground">{text}</p>;
}
