import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import type { ContentWithCategory } from "@/lib/library";

export const publicStatsQuery = queryOptions({
  queryKey: ["public-stats"],
  queryFn: async () => {
    const [content, members, events] = await Promise.all([
      supabase.from("content_items").select("id", { count: "exact", head: true }).eq("published", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("published", true)
        .gte("starts_at", new Date().toISOString()),
    ]);
    return {
      content: content.count ?? 0,
      members: members.count ?? 0,
      upcomingEvents: events.count ?? 0,
    };
  },
});

export const featuredContentQuery = queryOptions({
  queryKey: ["featured-content"],
  queryFn: async (): Promise<ContentWithCategory[]> => {
    const { data, error } = await supabase
      .from("content_items")
      .select("*, category:categories(id,slug,name_en,name_pt,color,icon)")
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3);
    if (error) throw error;
    return (data ?? []) as ContentWithCategory[];
  },
});
