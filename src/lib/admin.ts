import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ContentItem = Database["public"]["Tables"]["content_items"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export type AdminContentRow = ContentItem & {
  category: Pick<Category, "id" | "name_en" | "name_pt" | "color"> | null;
  author: Pick<Profile, "id" | "full_name" | "email"> | null;
};

export const adminContentListQuery = queryOptions({
  queryKey: ["admin", "content", "all"],
  queryFn: async (): Promise<AdminContentRow[]> => {
    const { data, error } = await supabase
      .from("content_items")
      .select(
        "*, category:categories(id,name_en,name_pt,color), author:profiles(id,full_name,email)",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminContentRow[];
  },
});

export const adminContentByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["admin", "content", id],
    queryFn: async (): Promise<ContentItem | null> => {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const adminCategoriesQuery = queryOptions({
  queryKey: ["admin", "categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export type UserRow = Profile & { role: AppRole };

export const adminUsersQuery = queryOptions({
  queryKey: ["admin", "users"],
  queryFn: async (): Promise<UserRow[]> => {
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (pErr) throw pErr;
    if (rErr) throw rErr;
    const roleMap = new Map<string, AppRole>();
    for (const r of roles ?? []) {
      const prev = roleMap.get(r.user_id);
      if (prev !== "admin") roleMap.set(r.user_id, r.role);
    }
    return (profiles ?? []).map((p) => ({ ...p, role: roleMap.get(p.id) ?? "member" }));
  },
});

export const adminStatsQuery = queryOptions({
  queryKey: ["admin", "stats"],
  queryFn: async () => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [contentCount, userCount, publishedMonth, drafts] = await Promise.all([
      supabase.from("content_items").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("content_items")
        .select("id", { count: "exact", head: true })
        .eq("published", true)
        .gte("created_at", monthStart.toISOString()),
      supabase.from("content_items").select("id", { count: "exact", head: true }).eq("published", false),
    ]);
    return {
      totalContent: contentCount.count ?? 0,
      totalUsers: userCount.count ?? 0,
      publishedThisMonth: publishedMonth.count ?? 0,
      drafts: drafts.count ?? 0,
    };
  },
});

export const adminRecentActivityQuery = queryOptions({
  queryKey: ["admin", "recent"],
  queryFn: async (): Promise<AdminContentRow[]> => {
    const { data, error } = await supabase
      .from("content_items")
      .select("*, category:categories(id,name_en,name_pt,color), author:profiles(id,full_name,email)")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return (data ?? []) as AdminContentRow[];
  },
});

export const siteSettingsQuery = queryOptions({
  queryKey: ["admin", "settings"],
  queryFn: async (): Promise<Record<string, unknown>> => {
    const { data, error } = await supabase.from("site_settings").select("key, value");
    if (error) throw error;
    const out: Record<string, unknown> = {};
    for (const row of data ?? []) out[row.key] = row.value;
    return out;
  },
});
