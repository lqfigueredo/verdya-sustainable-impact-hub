import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

export type Subscriber = Database["public"]["Tables"]["newsletter_subscribers"]["Row"];
export type Campaign = Database["public"]["Tables"]["newsletter_campaigns"]["Row"];

export async function subscribe(email: string, languagePref: "en" | "pt") {
  const clean = email.trim().toLowerCase();
  const { error } = await supabase.rpc("subscribe_newsletter", {
    _email: clean,
    _language_pref: languagePref,
  });
  if (error) throw error;
}


export const adminSubscribersQuery = queryOptions({
  queryKey: ["admin", "newsletter", "subscribers"],
  queryFn: async (): Promise<Subscriber[]> => {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const adminCampaignsQuery = queryOptions({
  queryKey: ["admin", "newsletter", "campaigns"],
  queryFn: async (): Promise<Campaign[]> => {
    const { data, error } = await supabase
      .from("newsletter_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export function subscribersToCSV(rows: Subscriber[]): string {
  const head = ["email", "language", "subscribed_at", "unsubscribed_at"].join(",");
  const body = rows
    .map((r) =>
      [r.email, r.language_pref, r.subscribed_at, r.unsubscribed_at ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  return `${head}\n${body}`;
}

export function downloadCSV(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
