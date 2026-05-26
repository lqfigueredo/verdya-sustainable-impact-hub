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

export type RecentActivityFeedItem =
  | { kind: "content"; id: string; createdAt: string; title: string; href: string; meta: string }
  | { kind: "topic"; id: string; createdAt: string; title: string; href: string; meta: string }
  | { kind: "registration"; id: string; createdAt: string; title: string; href: string; meta: string }
  | { kind: "subscriber"; id: string; createdAt: string; title: string; href: string; meta: string };

export const adminActivityFeedQuery = queryOptions({
  queryKey: ["admin", "activity-feed"],
  queryFn: async (): Promise<RecentActivityFeedItem[]> => {
    const [contentRes, topicsRes, regsRes, subsRes] = await Promise.all([
      supabase
        .from("content_items")
        .select("id,title_en,title_pt,type,created_at,published")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("forum_topics")
        .select("id,title,category,created_at,author:profiles(full_name,email)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("event_registrations")
        .select("id,registered_at,user_id,event_id")
        .order("registered_at", { ascending: false })
        .limit(5),
      supabase
        .from("newsletter_subscribers")
        .select("id,email,language_pref,subscribed_at")
        .is("unsubscribed_at", null)
        .order("subscribed_at", { ascending: false })
        .limit(5),
    ]);

    // Resolve event + profile names for the latest registrations (no FK in DB, so join client-side).
    const regRows = regsRes.data ?? [];
    const eventIds = Array.from(new Set(regRows.map((r) => r.event_id))).filter(Boolean);
    const userIds = Array.from(new Set(regRows.map((r) => r.user_id))).filter(Boolean);
    const [eventsRes, profilesRes] = await Promise.all([
      eventIds.length
        ? supabase.from("events").select("id,title_en,title_pt").in("id", eventIds)
        : Promise.resolve({ data: [] as { id: string; title_en: string; title_pt: string }[] }),
      userIds.length
        ? supabase.from("profiles").select("id,full_name,email").in("id", userIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null }[] }),
    ]);
    const eventMap = new Map((eventsRes.data ?? []).map((e) => [e.id, e]));
    const profMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

    const items: RecentActivityFeedItem[] = [];

    for (const c of contentRes.data ?? []) {
      items.push({
        kind: "content",
        id: c.id,
        createdAt: c.created_at,
        title: c.title_en,
        href: `/admin/content/${c.id}/edit`,
        meta: `${c.type} · ${c.published ? "published" : "draft"}`,
      });
    }
    for (const t of (topicsRes.data ?? []) as Array<{
      id: string;
      title: string;
      category: string;
      created_at: string;
      author: { full_name: string | null; email: string | null } | null;
    }>) {
      items.push({
        kind: "topic",
        id: t.id,
        createdAt: t.created_at,
        title: t.title,
        href: `/community/topic/${t.id}`,
        meta: `${t.category} · ${t.author?.full_name ?? t.author?.email ?? "—"}`,
      });
    }
    for (const r of (regsRes.data ?? []) as Array<{
      id: string;
      registered_at: string;
      event: { id: string; title_en: string; title_pt: string } | null;
      profile: { full_name: string | null; email: string | null } | null;
    }>) {
      if (!r.event) continue;
      items.push({
        kind: "registration",
        id: r.id,
        createdAt: r.registered_at,
        title: r.event.title_en,
        href: `/events/${r.event.id}`,
        meta: r.profile?.full_name ?? r.profile?.email ?? "—",
      });
    }
    for (const s of subsRes.data ?? []) {
      items.push({
        kind: "subscriber",
        id: s.id,
        createdAt: s.subscribed_at,
        title: s.email,
        href: "/admin/newsletter",
        meta: `lang: ${s.language_pref}`,
      });
    }

    return items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);
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
