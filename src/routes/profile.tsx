import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/profile")({
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});

function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", bio: "", company: "", country: "", avatar_url: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm({
        full_name: data.full_name ?? "",
        bio: data.bio ?? "",
        company: data.company ?? "",
        country: data.country ?? "",
        avatar_url: data.avatar_url ?? "",
      });
      setLoading(false);
    });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(t("profile.error"));
    else toast.success(t("profile.saved"));
  };

  const field = (key: keyof typeof form, label: string, type: "text" | "textarea" = "text") => (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      {type === "textarea" ? (
        <textarea rows={4} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-input bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
      ) : (
        <input type="text" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-input bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
      )}
    </div>
  );

  return (
    <Layout>
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-4xl font-medium tracking-tight">{t("profile.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("profile.subtitle")}</p>

        {loading ? (
          <div className="mt-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <form onSubmit={save} className="mt-10 space-y-5">
            {field("full_name", t("profile.fullName"))}
            {field("bio", t("profile.bio"), "textarea")}
            {field("company", t("profile.company"))}
            {field("country", t("profile.country"))}
            {field("avatar_url", t("profile.avatarUrl"))}
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? t("profile.saving") : t("profile.save")}
            </button>
          </form>
        )}
      </section>
    </Layout>
  );
}
