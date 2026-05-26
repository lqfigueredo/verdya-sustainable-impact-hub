import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type EventRegistration = Database["public"]["Tables"]["event_registrations"]["Row"];
export type LocationType = Database["public"]["Enums"]["event_location_type"];

export type Speaker = { name: string; title?: string; avatar_url?: string };

export const upcomingEventsQuery = (limit = 3) =>
  queryOptions({
    queryKey: ["events", "upcoming", limit],
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("published", true)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });

export type EventFilters = {
  when?: "upcoming" | "past";
  location?: LocationType | null;
  category?: string | null;
};

export const eventsListQuery = (filters: EventFilters = {}) =>
  queryOptions({
    queryKey: ["events", "list", filters],
    queryFn: async (): Promise<EventRow[]> => {
      const now = new Date().toISOString();
      let q = supabase.from("events").select("*").eq("published", true);
      if (filters.when === "past") q = q.lt("starts_at", now).order("starts_at", { ascending: false });
      else q = q.gte("starts_at", now).order("starts_at", { ascending: true });
      if (filters.location) q = q.eq("location_type", filters.location);
      if (filters.category) q = q.eq("category", filters.category);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

export const eventByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["event", id],
    queryFn: async (): Promise<EventRow | null> => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const myRegistrationQuery = (eventId: string, userId: string | null) =>
  queryOptions({
    queryKey: ["event-registration", eventId, userId],
    queryFn: async (): Promise<EventRegistration | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const myEventsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["my-events", userId],
    queryFn: async (): Promise<(EventRegistration & { event: EventRow | null })[]> => {
      if (!userId) return [];
      const { data: regs, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("user_id", userId)
        .order("registered_at", { ascending: false });
      if (error) throw error;
      const ids = (regs ?? []).map((r) => r.event_id);
      if (ids.length === 0) return [];
      const { data: evs } = await supabase.from("events").select("*").in("id", ids);
      const map = new Map((evs ?? []).map((e) => [e.id, e]));
      return (regs ?? []).map((r) => ({ ...r, event: map.get(r.event_id) ?? null }));
    },
  });

export const adminEventsQuery = queryOptions({
  queryKey: ["admin", "events"],
  queryFn: async (): Promise<EventRow[]> => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("starts_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const eventRegistrantsQuery = (eventId: string) =>
  queryOptions({
    queryKey: ["admin", "event-registrants", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data ?? [];
    },
  });

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildICS(ev: EventRow, lang: "en" | "pt"): string {
  const title = (lang === "pt" ? ev.title_pt : ev.title_en) || ev.title_en;
  const desc = ((lang === "pt" ? ev.description_pt : ev.description_en) || "").replace(/\n/g, "\\n");
  const loc = ev.meeting_url || ev.location_detail || "";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Verdya//Events//EN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@verdya`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(new Date(ev.starts_at))}`,
    `DTEND:${icsDate(new Date(ev.ends_at))}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${loc}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadICS(ev: EventRow, lang: "en" | "pt") {
  const ics = buildICS(ev, lang);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.title_en.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function pickLang<T extends Record<string, unknown>>(row: T, base: string, lang: string): string {
  const key = lang === "pt" ? `${base}_pt` : `${base}_en`;
  const fallback = lang === "pt" ? `${base}_en` : `${base}_pt`;
  return (row[key] as string) || (row[fallback] as string) || "";
}
