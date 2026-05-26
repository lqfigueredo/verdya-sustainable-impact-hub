import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Markdown } from "@/components/Markdown";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FORUM_CATEGORIES, detectFlag } from "@/lib/forum";

export const Route = createFileRoute("/community/new")({
  head: () => ({
    meta: [{ title: "New discussion — Verdya" }],
  }),
  component: NewTopic,
});

function NewTopic() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (!title.trim() || !body.trim()) throw new Error("validation");
      const flagged = detectFlag(`${title} ${body}`);
      const tagArr = tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);
      const { data, error } = await supabase
        .from("forum_topics")
        .insert({
          title: title.trim().slice(0, 200),
          body: body.trim(),
          category,
          tags: tagArr,
          author_id: user.id,
          flagged,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success(t("forum.toasts.topicCreated"));
      navigate({ to: "/community/topic/$id", params: { id } });
    },
    onError: (e: Error) => {
      if (e.message === "validation") toast.error(t("forum.errors.required"));
      else toast.error(t("forum.errors.create"));
    },
  });

  if (loading) return <Layout><div className="p-12" /></Layout>;
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-serif text-3xl text-foreground">{t("forum.loginRequired")}</h1>
          <p className="mt-2 text-muted-foreground">{t("forum.loginToParticipate")}</p>
          <Button asChild className="mt-6">
            <Link to="/login">{t("nav.login")}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          to="/community"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t("forum.backToCommunity")}
        </Link>
        <h1 className="mt-4 font-serif text-3xl text-foreground">{t("forum.new.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("forum.new.subtitle")}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="mt-8 space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="title">{t("forum.new.titleLabel")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              placeholder={t("forum.new.titlePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("forum.new.category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORUM_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`forum.categories.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("forum.new.body")}</Label>
            <Tabs defaultValue="write">
              <TabsList>
                <TabsTrigger value="write">{t("forum.new.write")}</TabsTrigger>
                <TabsTrigger value="preview">{t("forum.new.preview")}</TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  required
                  placeholder={t("forum.new.bodyPlaceholder")}
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="min-h-[200px] rounded-md border border-border bg-card p-4">
                  {body.trim() ? (
                    <Markdown>{body}</Markdown>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("forum.new.previewEmpty")}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">{t("forum.new.tags")}</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t("forum.new.tagsPlaceholder")}
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/community" })}>
              {t("forum.new.cancel")}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t("forum.new.posting") : t("forum.new.post")}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
