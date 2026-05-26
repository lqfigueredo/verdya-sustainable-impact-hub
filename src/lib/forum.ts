import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

export type ForumTopic = Database["public"]["Tables"]["forum_topics"]["Row"];
export type ForumReply = Database["public"]["Tables"]["forum_replies"]["Row"];
export type ForumReaction = Database["public"]["Tables"]["forum_reactions"]["Row"];
export type ReactionType = Database["public"]["Enums"]["reaction_type"];
export type ReactionTarget = Database["public"]["Enums"]["reaction_target"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

type AuthorMini = {
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

const AUTHOR_FIELDS = "id, full_name, avatar_url, company, country, bio";

// --- Topics list ---
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
        .select(
          `*, author:profiles!forum_topics_author_id_fkey(${AUTHOR_FIELDS}),
           replies:forum_replies(count),
           reactions:forum_reactions!inner(count)`,
          { count: "exact" },
        )
        .order("pinned", { ascending: false });

      // We can't easily inner-join reactions count without filter; use a simpler approach: separate counts.
      // Re-issue with simple select.
      let base = supabase
        .from("forum_topics")
        .select(`*, author:profiles!forum_topics_author_id_fkey(${AUTHOR_FIELDS})`)
        .order("pinned", { ascending: false });

      if (params.category) base = base.eq("category", params.category);
      if (params.search) {
        const s = params.search.replace(/[%,]/g, " ").trim();
        if (s) base = base.or(`title.ilike.%${s}%,body.ilike.%${s}%`);
      }

      if (params.sort === "replies" || params.sort === "trending") {
        base = base.order("last_reply_at", { ascending: false });
      } else {
        base = base.order("last_reply_at", { ascending: false });
      }
      base = base.limit(100);

      const { data, error } = await base;
      if (error) throw error;
      const topics = (data ?? []) as (ForumTopic & { author: AuthorMini | null })[];

      // Fetch counts in batch
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

      if (params.sort === "replies") {
        result = [...result].sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return b.reply_count - a.reply_count;
        });
      } else if (params.sort === "trending") {
        result = [...result].sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return b.reaction_count + b.reply_count - (a.reaction_count + a.reply_count);
        });
      }

      // suppress unused
      void q;

      return result;
    },
  });

// --- Single topic ---
export const forumTopicQuery = (id: string) =>
  queryOptions({
    queryKey: ["forum-topic", id],
    queryFn: async (): Promise<(ForumTopic & { author: AuthorMini | null }) | null> => {
      const { data, error } = await supabase
        .from("forum_topics")
        .select(`*, author:profiles!forum_topics_author_id_fkey(${AUTHOR_FIELDS})`)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as (ForumTopic & { author: AuthorMini | null }) | null;
    },
  });

// --- Replies for topic ---
export const forumRepliesQuery = (topicId: string) =>
  queryOptions({
    queryKey: ["forum-replies", topicId],
    queryFn: async (): Promise<ReplyWithAuthor[]> => {
      const { data, error } = await supabase
        .from("forum_replies")
        .select(`*, author:profiles!forum_replies_author_id_fkey(${AUTHOR_FIELDS})`)
        .eq("topic_id", topicId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReplyWithAuthor[];
    },
  });

// --- Reactions for a target ---
export const forumReactionsQuery = (
  targetType: ReactionTarget,
  targetIds: string[],
) =>
  queryOptions({
    queryKey: ["forum-reactions", targetType, targetIds.sort().join(",")],
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

// --- Notifications ---
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

// --- Simple profanity / spam filter ---
const BLOCKLIST = [
  "viagra",
  "casino",
  "porn",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "nigger",
  "faggot",
  "merda",
  "porra",
  "caralho",
  "puta",
];

export function detectFlag(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKLIST.some((w) => lower.includes(w));
}
