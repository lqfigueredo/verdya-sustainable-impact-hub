import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { siteSettingsQuery } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

type SettingsState = {
  site_title: string;
  hero_text_en: string;
  hero_text_pt: string;
  social_twitter: string;
  social_linkedin: string;
  social_instagram: string;
  featured_content_ids: string;
};

const empty: SettingsState = {
  site_title: "", hero_text_en: "", hero_text_pt: "",
  social_twitter: "", social_linkedin: "", social_instagram: "",
  featured_content_ids: "",
};

function SettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(siteSettingsQuery);
  const [form, setForm] = useState<SettingsState>(empty);

  useEffect(() => {
    if (!data) return;
    const social = (data.social_links as Record<string, string> | undefined) ?? {};
    setForm({
      site_title: String(data.site_title ?? ""),
      hero_text_en: String(data.hero_text_en ?? ""),
      hero_text_pt: String(data.hero_text_pt ?? ""),
      social_twitter: social.twitter ?? "",
      social_linkedin: social.linkedin ?? "",
      social_instagram: social.instagram ?? "",
      featured_content_ids: Array.isArray(data.featured_content_ids) ? (data.featured_content_ids as string[]).join(", ") : "",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = [
        { key: "site_title", value: form.site_title },
        { key: "hero_text_en", value: form.hero_text_en },
        { key: "hero_text_pt", value: form.hero_text_pt },
        { key: "social_links", value: { twitter: form.social_twitter, linkedin: form.social_linkedin, instagram: form.social_instagram } },
        { key: "featured_content_ids", value: form.featured_content_ids.split(",").map((s) => s.trim()).filter(Boolean) },
      ];
      const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success(t("admin.toast.saved"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight">{t("admin.settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.settings.subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-5 rounded-xl border bg-background p-6">
          <div>
            <Label>{t("admin.settings.siteTitle")}</Label>
            <Input value={form.site_title} onChange={(e) => setForm({ ...form, site_title: e.target.value })} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>{t("admin.settings.heroEn")}</Label>
              <Textarea rows={3} value={form.hero_text_en} onChange={(e) => setForm({ ...form, hero_text_en: e.target.value })} />
            </div>
            <div>
              <Label>{t("admin.settings.heroPt")}</Label>
              <Textarea rows={3} value={form.hero_text_pt} onChange={(e) => setForm({ ...form, hero_text_pt: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>{t("admin.settings.featured")}</Label>
            <Input value={form.featured_content_ids} onChange={(e) => setForm({ ...form, featured_content_ids: e.target.value })} placeholder="uuid1, uuid2, uuid3" />
            <p className="mt-1 text-xs text-muted-foreground">{t("admin.settings.featuredHint")}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <Label>Twitter / X</Label>
              <Input value={form.social_twitter} onChange={(e) => setForm({ ...form, social_twitter: e.target.value })} placeholder="https://" />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input value={form.social_linkedin} onChange={(e) => setForm({ ...form, social_linkedin: e.target.value })} placeholder="https://" />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={form.social_instagram} onChange={(e) => setForm({ ...form, social_instagram: e.target.value })} placeholder="https://" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {t("admin.toast.save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
