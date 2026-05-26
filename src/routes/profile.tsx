import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Calendar, BookOpen, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/use-auth";
import { useLang } from "@/hooks/use-lang";
import { myEventsQuery, pickLang as pickEventLang } from "@/lib/events";
import { favoritesQuery, pickLang } from "@/lib/library";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

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
  const lang = useLang();
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

  const myEvents = useQuery({ ...myEventsQuery(userId), enabled: !!userId });
  const favIds = useQuery({ ...favoritesQuery(userId), enabled: !!userId });
  const favorites = useQuery({
    queryKey: ["profile-favorites", favIds.data],
    enabled: !!favIds.data && favIds.data.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("content_items")
        .select("id,title_en,title_pt,type,reading_time_min")
        .in("id", favIds.data!);
      return data ?? [];
    },
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
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-4xl font-medium tracking-tight">{t("profile.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("profile.subtitle")}</p>

        <Tabs defaultValue="edit" className="mt-10">
          <TabsList>
            <TabsTrigger value="edit"><UserIcon className="mr-1.5 h-3.5 w-3.5" /> {t("profileTabs.edit")}</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="mr-1.5 h-3.5 w-3.5" /> {t("profileTabs.events")}</TabsTrigger>
            <TabsTrigger value="favorites"><BookOpen className="mr-1.5 h-3.5 w-3.5" /> {t("profileTabs.favorites")}</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-8">
            {profile.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
                className="space-y-5"
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
          </TabsContent>

          <TabsContent value="events" className="mt-8">
            {myEvents.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !myEvents.data || myEvents.data.length === 0 ? (
              <Empty text={t("dashboard.empty.events")} />
            ) : (
              <ul className="divide-y rounded-2xl border bg-card">
                {myEvents.data.map((r) =>
                  r.event ? (
                    <li key={r.id} className="p-5">
                      <Link to="/events/$id" params={{ id: r.event.id }} className="block hover:text-primary">
                        <p className="font-medium">{pickEventLang(r.event, "title", lang)}</p>
                        <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                          {new Date(r.event.starts_at).toLocaleString(lang === "pt" ? "pt-BR" : "en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-8">
            {favIds.isLoading || favorites.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !favorites.data || favorites.data.length === 0 ? (
              <Empty text={t("dashboard.empty.favorites")} />
            ) : (
              <ul className="divide-y rounded-2xl border bg-card">
                {favorites.data.map((c) => (
                  <li key={c.id} className="p-5">
                    <Link to="/library/$contentId" params={{ contentId: c.id }} className="block hover:text-primary">
                      <p className="font-medium">{pickLang(c, "title", lang)}</p>
                      <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                        {t(`library.types.${c.type}`)} · {c.reading_time_min} {t("library.minRead")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</p>;
}
