import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type ContentItem = Database["public"]["Tables"]["content_items"]["Row"];
export type ContentType = Database["public"]["Enums"]["content_type"];
export type Difficulty = Database["public"]["Enums"]["content_difficulty"];

export type ContentWithCategory = ContentItem & {
  category: Pick<Category, "id" | "slug" | "name_en" | "name_pt" | "color" | "icon"> | null;
};

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export type ContentFilters = {
  search?: string;
  categoryId?: string | null;
  type?: ContentType | null;
  difficulty?: Difficulty | null;
  tag?: string | null;
};

export const contentListQuery = (filters: ContentFilters = {}) =>
  queryOptions({
    queryKey: ["content", filters],
    queryFn: async (): Promise<ContentWithCategory[]> => {
      let q = supabase
        .from("content_items")
        .select("*, category:categories(id,slug,name_en,name_pt,color,icon)")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
      if (filters.type) q = q.eq("type", filters.type);
      if (filters.difficulty) q = q.eq("difficulty", filters.difficulty);
      if (filters.tag) q = q.contains("tags", [filters.tag]);
      if (filters.search) {
        const s = filters.search.replace(/[%,]/g, " ").trim();
        if (s) {
          q = q.or(
            [`title_en.ilike.%${s}%`, `title_pt.ilike.%${s}%`, `summary_en.ilike.%${s}%`, `summary_pt.ilike.%${s}%`].join(","),
          );
        }
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ContentWithCategory[];
    },
  });

export const categoryBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: async (): Promise<Category | null> => {
      const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const contentItemQuery = (id: string) =>
  queryOptions({
    queryKey: ["content-item", id],
    queryFn: async (): Promise<ContentWithCategory | null> => {
      const { data, error } = await supabase
        .from("content_items")
        .select("*, category:categories(id,slug,name_en,name_pt,color,icon)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as ContentWithCategory | null;
    },
  });

export const relatedContentQuery = (categoryId: string, excludeId: string) =>
  queryOptions({
    queryKey: ["related", categoryId, excludeId],
    queryFn: async (): Promise<ContentWithCategory[]> => {
      const { data, error } = await supabase
        .from("content_items")
        .select("*, category:categories(id,slug,name_en,name_pt,color,icon)")
        .eq("published", true)
        .eq("category_id", categoryId)
        .neq("id", excludeId)
        .limit(3);
      if (error) throw error;
      return (data ?? []) as ContentWithCategory[];
    },
  });

export const favoritesQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["favorites", userId],
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.from("favorites").select("content_id").eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).map((r) => r.content_id);
    },
  });

export function pickLang<T extends Record<string, unknown>>(row: T, base: string, lang: string): string {
  const key = lang === "pt" ? `${base}_pt` : `${base}_en`;
  const fallback = lang === "pt" ? `${base}_en` : `${base}_pt`;
  return (row[key] as string) || (row[fallback] as string) || "";
}
