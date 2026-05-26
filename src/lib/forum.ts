import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

export type ForumTopic = Database["public"]["Tables"]["forum_topics"]["Row"];
export type ForumReply = Database["public"]["Tables"]["forum_replies"]["Row"];
export type ForumReaction = Database["public"]["Tables"]["forum_reactions"]["Row"];
export type ReactionType = Database["public"]["Enums"]["reaction_type"];
export type ReactionTarget = Database["public"]["Enums"]["reaction_target"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export type AuthorMini = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  country: string | null;
  bio: string | null;
};

export type TopicWithMeta = ForumTopic & {
  author: AuthorMini | null;
  reply_count: number;
  reaction_count: number;
};

export type ReplyWithAuthor = ForumReply & { author: AuthorMini | null };

export const FORUM_CATEGORIES = [
  "general",
  "carbon",
  "csrd",
  "circular",
  "biodiversity",
  "social",
  "governance",
] as const;

export type ForumSort = "latest" | "replies" | "trending";

// Lean projection for lists (no bio/country to avoid leaking personal data in large queries).
const AUTHOR_SELECT_LIST = "id, full_name, avatar_url, company";
// Full projection for single-topic / single-reply views.
const AUTHOR_SELECT_FULL = "id, full_name, avatar_url, company, country, bio";
const AUTHOR_SELECT = AUTHOR_SELECT_LIST;

export const forumTopicsQuery = (params: {
  category?: string | null;
  sort?: ForumSort;
  search?: string;
} = {}) =>
  queryOptions({
    queryKey: ["forum-topics", params],
    queryFn: async (): Promise<TopicWithMeta[]> => {
      let q = supabase
        .from("forum_topics")
        .select(`*, author:profiles(${AUTHOR_SELECT})`)
        .order("pinned", { ascending: false })
        .order("last_reply_at", { ascending: false })
        .limit(100);

      if (params.category) q = q.eq("category", params.category);
      if (params.search) {
        const s = params.search.replace(/[%,]/g, " ").trim();
        if (s) q = q.or(`title.ilike.%${s}%,body.ilike.%${s}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      const topics = (data ?? []) as unknown as (ForumTopic & { author: AuthorMini | null })[];

      const ids = topics.map((t) => t.id);
      if (ids.length === 0) return [];

      const [{ data: replyRows }, { data: reactionRows }] = await Promise.all([
        supabase.from("forum_replies").select("topic_id").in("topic_id", ids),
        supabase
          .from("forum_reactions")
          .select("target_id")
          .eq("target_type", "topic")
          .in("target_id", ids),
      ]);

      const replyCounts = new Map<string, number>();
      (replyRows ?? []).forEach((r) =>
        replyCounts.set(r.topic_id, (replyCounts.get(r.topic_id) ?? 0) + 1),
      );
      const reactionCounts = new Map<string, number>();
      (reactionRows ?? []).forEach((r) =>
        reactionCounts.set(r.target_id, (reactionCounts.get(r.target_id) ?? 0) + 1),
      );

      let result: TopicWithMeta[] = topics.map((t) => ({
        ...t,
        reply_count: replyCounts.get(t.id) ?? 0,
        reaction_count: reactionCounts.get(t.id) ?? 0,
      }));

      const sort = params.sort ?? "latest";
      if (sort === "replies") {
        result.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return b.reply_count - a.reply_count;
        });
      } else if (sort === "trending") {
        result.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return b.reaction_count + b.reply_count - (a.reaction_count + a.reply_count);
        });
      }

      return result;
    },
  });

export const forumTopicQuery = (id: string) =>
  queryOptions({
    queryKey: ["forum-topic", id],
    queryFn: async (): Promise<(ForumTopic & { author: AuthorMini | null }) | null> => {
      const { data, error } = await supabase
        .from("forum_topics")
        .select(`*, author:profiles(${AUTHOR_SELECT})`)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as (ForumTopic & { author: AuthorMini | null }) | null;
    },
  });

export const forumRepliesQuery = (topicId: string) =>
  queryOptions({
    queryKey: ["forum-replies", topicId],
    queryFn: async (): Promise<ReplyWithAuthor[]> => {
      const { data, error } = await supabase
        .from("forum_replies")
        .select(`*, author:profiles(${AUTHOR_SELECT})`)
        .eq("topic_id", topicId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ReplyWithAuthor[];
    },
  });

export const forumReactionsQuery = (
  targetType: ReactionTarget,
  targetIds: string[],
) =>
  queryOptions({
    queryKey: ["forum-reactions", targetType, [...targetIds].sort().join(",")],
    queryFn: async (): Promise<ForumReaction[]> => {
      if (targetIds.length === 0) return [];
      const { data, error } = await supabase
        .from("forum_reactions")
        .select("*")
        .eq("target_type", targetType)
        .in("target_id", targetIds);
      if (error) throw error;
      return data ?? [];
    },
  });

export const notificationsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["notifications", userId],
    queryFn: async (): Promise<Notification[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

const BLOCKLIST = [
  "viagra", "casino", "porn", "fuck", "shit", "bitch", "asshole",
  "cunt", "nigger", "faggot",
  "merda", "porra", "caralho", "puta",
];

export function detectFlag(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKLIST.some((w) => lower.includes(w));
}
