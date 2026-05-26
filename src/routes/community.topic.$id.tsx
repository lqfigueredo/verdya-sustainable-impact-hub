import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock, Pin, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Markdown } from "@/components/Markdown";
import { RelativeTime } from "@/components/RelativeTime";
import { ReactionBar } from "@/components/forum/ReactionBar";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  forumTopicQuery,
  forumRepliesQuery,
  detectFlag,
  type ReplyWithAuthor,
} from "@/lib/forum";

export const Route = createFileRoute("/community/topic/$id")({
  head: () => ({ meta: [{ title: "Discussion — Verdya" }] }),
  component: TopicView,
});

function AuthorAvatar({ name, url, size = 10 }: { name?: string | null; url?: string | null; size?: number }) {
  const initials = name?.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() ?? "?";
  return (
    <div
      style={{ height: `${size * 4}px`, width: `${size * 4}px` }}
      className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary"
    >
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : initials}
    </div>
  );
}

function TopicView() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: topic, isLoading } = useQuery(forumTopicQuery(id));
  const { data: replies = [] } = useQuery(forumRepliesQuery(id));

  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const postReply = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (!replyText.trim()) throw new Error("validation");
      const { error } = await supabase.from("forum_replies").insert({
        topic_id: id,
        parent_reply_id: replyingTo,
        body: replyText.trim(),
        author_id: user.id,
        flagged: detectFlag(replyText),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setReplyText("");
      setReplyingTo(null);
      qc.invalidateQueries({ queryKey: ["forum-replies", id] });
      qc.invalidateQueries({ queryKey: ["forum-topic", id] });
      toast.success(t("forum.toasts.replyPosted"));
    },
    onError: () => toast.error(t("forum.errors.reply")),
  });

  const adminAction = useMutation({
    mutationFn: async (patch: { pinned?: boolean; locked?: boolean }) => {
      const { error } = await supabase.from("forum_topics").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forum-topic", id] });
      toast.success(t("forum.toasts.updated"));
    },
  });

  const deleteTopic = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("forum_topics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("forum.toasts.deleted"));
      navigate({ to: "/community" });
    },
  });

  const deleteReply = useMutation({
    mutationFn: async (replyId: string) => {
      const { error } = await supabase.from("forum_replies").delete().eq("id", replyId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forum-replies", id] });
      toast.success(t("forum.toasts.deleted"));
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl space-y-4 px-6 py-12">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Layout>
    );
  }

  if (!topic) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-serif text-3xl">{t("forum.notFound")}</h1>
          <Button asChild className="mt-6">
            <Link to="/community">{t("forum.backToCommunity")}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const topLevel = replies.filter((r) => !r.parent_reply_id);
  const repliesOf = (parentId: string) => replies.filter((r) => r.parent_reply_id === parentId);
  const canEditTopic = isAdmin || user?.id === topic.author_id;

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link to="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("forum.backToCommunity")}
        </Link>

        <article className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {topic.pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                <Pin className="h-3 w-3" /> {t("forum.pinned")}
              </span>
            )}
            {topic.locked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Lock className="h-3 w-3" /> {t("forum.locked")}
              </span>
            )}
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
              {t(`forum.categories.${topic.category}`, { defaultValue: topic.category })}
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">{topic.title}</h1>

          <div className="mt-5 flex items-center gap-3 border-b border-border pb-5">
            <AuthorAvatar name={topic.author?.full_name} url={topic.author?.avatar_url} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {topic.author?.full_name ?? t("forum.anonymous")}
              </p>
              <p className="text-xs text-muted-foreground">
                {topic.author?.company && <span>{topic.author.company} · </span>}
                <RelativeTime date={topic.created_at} />
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => adminAction.mutate({ pinned: !topic.pinned })}>
                  <Pin className="h-4 w-4" /> {topic.pinned ? t("forum.admin.unpin") : t("forum.admin.pin")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => adminAction.mutate({ locked: !topic.locked })}>
                  <Lock className="h-4 w-4" /> {topic.locked ? t("forum.admin.unlock") : t("forum.admin.lock")}
                </Button>
              </div>
            )}
            {canEditTopic && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("forum.confirmDelete.title")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("forum.confirmDelete.topic")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("forum.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteTopic.mutate()}>
                      {t("forum.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div className="pt-6">
            <Markdown>{topic.body}</Markdown>
          </div>

          {topic.author?.bio && (
            <aside className="mt-8 rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("forum.aboutAuthor")}
              </p>
              <p className="mt-2 text-sm text-foreground">{topic.author.bio}</p>
            </aside>
          )}

          <div className="mt-6">
            <ReactionBar targetType="topic" targetId={topic.id} />
          </div>
        </article>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-serif text-2xl text-foreground">
            <MessageSquare className="h-5 w-5" /> {t("forum.replies", { count: replies.length })}
          </h2>

          <div className="mt-6 space-y-6">
            {topLevel.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {t("forum.noReplies")}
              </p>
            )}
            {topLevel.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                children={repliesOf(reply.id)}
                onReply={() => setReplyingTo(reply.id)}
                onDelete={() => deleteReply.mutate(reply.id)}
                canDelete={isAdmin || user?.id === reply.author_id}
              />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">{t("forum.loginToParticipate")}</p>
              <Button asChild><Link to="/login">{t("nav.login")}</Link></Button>
            </div>
          ) : topic.locked && !isAdmin ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              <Lock className="mr-2 inline h-4 w-4" /> {t("forum.lockedNotice")}
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                postReply.mutate();
              }}
            >
              <label className="text-sm font-medium text-foreground">
                {replyingTo ? t("forum.replyingTo") : t("forum.yourReply")}
              </label>
              {replyingTo && (
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="ml-2 text-xs text-muted-foreground underline"
                >
                  {t("forum.cancel")}
                </button>
              )}
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={5}
                required
                placeholder={t("forum.replyPlaceholder")}
                className="mt-2 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">{t("forum.markdownSupported")}</p>
              <div className="mt-3 flex justify-end">
                <Button type="submit" disabled={postReply.isPending}>
                  {postReply.isPending ? t("forum.posting") : t("forum.postReply")}
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </Layout>
  );
}

function ReplyItem({
  reply,
  children,
  onReply,
  onDelete,
  canDelete,
}: {
  reply: ReplyWithAuthor;
  children: ReplyWithAuthor[];
  onReply: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <AuthorAvatar name={reply.author?.full_name} url={reply.author?.avatar_url} size={8} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{reply.author?.full_name ?? t("forum.anonymous")}</span>
            {reply.author?.company && <span>· {reply.author.company}</span>}
            <span>·</span>
            <RelativeTime date={reply.created_at} />
          </div>
          <div className="mt-3">
            <Markdown>{reply.body}</Markdown>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ReactionBar targetType="reply" targetId={reply.id} />
            <button onClick={onReply} className="text-xs font-medium text-muted-foreground hover:text-foreground">
              {t("forum.reply")}
            </button>
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-xs font-medium text-muted-foreground hover:text-destructive">
                    {t("forum.delete")}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("forum.confirmDelete.title")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("forum.confirmDelete.reply")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("forum.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>{t("forum.delete")}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          {children.length > 0 && (
            <div className="mt-5 space-y-4 border-l-2 border-border pl-4">
              {children.map((child) => (
                <div key={child.id} className="rounded-lg bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <AuthorAvatar name={child.author?.full_name} url={child.author?.avatar_url} size={7} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {child.author?.full_name ?? t("forum.anonymous")}
                        </span>
                        <span>·</span>
                        <RelativeTime date={child.created_at} />
                      </div>
                      <div className="mt-2">
                        <Markdown>{child.body}</Markdown>
                      </div>
                      <div className="mt-3">
                        <ReactionBar targetType="reply" targetId={child.id} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
