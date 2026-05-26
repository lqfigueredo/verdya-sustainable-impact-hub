import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
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

type ProfileForm = {
  full_name: string;
  bio: string;
  company: string;
  country: string;
  avatar_url: string;
};

const EMPTY_FORM: ProfileForm = {
  full_name: "",
  bio: "",
  company: "",
  country: "",
  avatar_url: "",
};

function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? null;
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);

  const profile = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile.data) {
      setForm({
        full_name: profile.data.full_name ?? "",
        bio: profile.data.bio ?? "",
        company: profile.data.company ?? "",
        country: profile.data.country ?? "",
        avatar_url: profile.data.avatar_url ?? "",
      });
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase.from("profiles").update(form).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success(t("profile.saved"));
    },
    onError: () => toast.error(t("profile.error")),
  });

  const field = (key: keyof ProfileForm, label: string, type: "text" | "textarea" = "text") => (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      {type === "textarea" ? (
        <textarea
          rows={4}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-input bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
      ) : (
        <input
          type="text"
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-input bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
      )}
    </div>
  );

  return (
    <Layout>
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-4xl font-medium tracking-tight">{t("profile.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("profile.subtitle")}</p>

        {profile.isLoading ? (
          <div className="mt-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="mt-10 space-y-5"
          >
            {field("full_name", t("profile.fullName"))}
            {field("bio", t("profile.bio"), "textarea")}
            {field("company", t("profile.company"))}
            {field("country", t("profile.country"))}
            {field("avatar_url", t("profile.avatarUrl"))}
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {save.isPending ? t("profile.saving") : t("profile.save")}
            </button>
          </form>
        )}
      </section>
    </Layout>
  );
}
