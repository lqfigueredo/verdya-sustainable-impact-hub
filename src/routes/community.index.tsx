import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MessageSquare, Pin, Lock, Sparkles, Plus, Search, Heart } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RelativeTime } from "@/components/RelativeTime";
import { useAuth } from "@/hooks/use-auth";
import {
  forumTopicsQuery,
  FORUM_CATEGORIES,
  type ForumSort,
} from "@/lib/forum";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      { title: "Community — Verdya" },
      {
        name: "description",
        content:
          "Join the Verdya community: discussions on corporate sustainability and ESG with practitioners worldwide.",
      },
    ],
  }),
  component: CommunityIndex,
});

function CommunityIndex() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<ForumSort>("latest");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: topics = [], isLoading } = useQuery(
    forumTopicsQuery({ category, sort, search }),
  );

  return (
    <Layout>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {t("forum.eyebrow")}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-foreground lg:text-5xl">
            {t("forum.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            {t("forum.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to={isAuthenticated ? "/community/new" : "/login"}>
                <Plus className="h-4 w-4" /> {t("forum.startDiscussion")}
              </Link>
            </Button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchInput);
              }}
              className="flex flex-1 items-center gap-2 sm:max-w-md"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t("forum.searchPlaceholder")}
                  className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategory(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              category === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {t("forum.filters.all")}
          </button>
          {FORUM_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {t(`forum.categories.${c}`)}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 rounded-full border border-border bg-background p-1">
            {(["latest", "replies", "trending"] as ForumSort[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  sort === s
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`forum.sort.${s}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-5">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))
          ) : topics.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl text-foreground">
                {t("forum.empty.title")}
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                {t("forum.empty.subtitle")}
              </p>
              <Button asChild className="mt-2">
                <Link to={isAuthenticated ? "/community/new" : "/login"}>
                  <Plus className="h-4 w-4" /> {t("forum.empty.cta")}
                </Link>
              </Button>
            </div>
          ) : (
            topics.map((topic) => {
              const initials =
                topic.author?.full_name?.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()
                ?? "?";
              return (
                <Link
                  key={topic.id}
                  to="/community/topic/$id"
                  params={{ id: topic.id }}
                  className="flex items-start gap-4 p-5 transition hover:bg-muted/30"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {topic.author?.avatar_url ? (
                      <img src={topic.author.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {topic.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          <Pin className="h-3 w-3" /> {t("forum.pinned")}
                        </span>
                      )}
                      {topic.locked && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <Lock className="h-3 w-3" />
                        </span>
                      )}
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {t(`forum.categories.${topic.category}`, { defaultValue: topic.category })}
                      </span>
                    </div>
                    <h3 className="mt-1.5 truncate font-serif text-lg text-foreground">
                      {topic.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{topic.author?.full_name ?? t("forum.anonymous")}</span>
                      {topic.author?.company && (
                        <span className="opacity-70">· {topic.author.company}</span>
                      )}
                      <span>·</span>
                      <RelativeTime date={topic.last_reply_at} />
                    </div>
                  </div>
                  <div className="hidden shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground sm:flex">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> {topic.reply_count}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" /> {topic.reaction_count}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </Layout>
  );
}
