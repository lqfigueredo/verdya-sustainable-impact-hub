import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Flag, Trash2, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { flaggedForumQuery } from "@/lib/admin";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/forum")({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(flaggedForumQuery);
  },
  component: AdminForum,
});

function AdminForum() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const lang = i18n.language?.startsWith("pt") ? "pt-BR" : "en-US";
  const { data, isLoading } = useQuery(flaggedForumQuery);

  const clearTopic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forum_topics").update({ flagged: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "forum", "flagged"] });
      toast.success(t("adminForum.cleared"));
    },
  });

  const deleteTopic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forum_topics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "forum", "flagged"] });
      toast.success(t("adminForum.deleted"));
    },
  });

  const clearReply = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forum_replies").update({ flagged: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "forum", "flagged"] }),
  });

  const deleteReply = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forum_replies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "forum", "flagged"] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight">{t("adminForum.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("adminForum.subtitle")}</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <Section title={t("adminForum.flaggedTopics")} count={data?.topics.length ?? 0}>
            {!data?.topics.length ? (
              <Empty text={t("adminForum.empty")} />
            ) : (
              <ul className="divide-y rounded-2xl border bg-card">
                {data.topics.map((tp) => (
                  <li key={tp.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Flag className="h-3 w-3 text-destructive" />
                          <span>{tp.category}</span>
                          <span>·</span>
                          <span>{new Date(tp.created_at).toLocaleString(lang)}</span>
                        </div>
                        <Link
                          to="/community/topic/$id"
                          params={{ id: tp.id }}
                          className="mt-1 block font-serif text-lg hover:text-primary"
                        >
                          {tp.title}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{tp.body}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {tp.author?.full_name ?? tp.author?.email ?? "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => clearTopic.mutate(tp.id)}
                          disabled={clearTopic.isPending}
                          className="inline-flex h-8 items-center gap-1 rounded-md border px-3 text-xs hover:bg-accent"
                        >
                          {clearTopic.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          {t("adminForum.clear")}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t("adminForum.confirmDelete"))) deleteTopic.mutate(tp.id);
                          }}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-destructive/40 px-3 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                          {t("adminForum.delete")}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={t("adminForum.flaggedReplies")} count={data?.replies.length ?? 0}>
            {!data?.replies.length ? (
              <Empty text={t("adminForum.empty")} />
            ) : (
              <ul className="divide-y rounded-2xl border bg-card">
                {data.replies.map((r) => (
                  <li key={r.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Flag className="h-3 w-3 text-destructive" />
                          <span>{new Date(r.created_at).toLocaleString(lang)}</span>
                        </div>
                        {r.topic && (
                          <Link
                            to="/community/topic/$id"
                            params={{ id: r.topic.id }}
                            className="mt-1 block text-sm font-medium hover:text-primary"
                          >
                            {r.topic.title}
                          </Link>
                        )}
                        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{r.body}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {r.author?.full_name ?? r.author?.email ?? "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => clearReply.mutate(r.id)}
                          className="inline-flex h-8 items-center gap-1 rounded-md border px-3 text-xs hover:bg-accent"
                        >
                          <Check className="h-3 w-3" />
                          {t("adminForum.clear")}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t("adminForum.confirmDelete"))) deleteReply.mutate(r.id);
                          }}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-destructive/40 px-3 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                          {t("adminForum.delete")}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-serif text-xl">
        {title}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{count}</span>
      </h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</p>;
}
