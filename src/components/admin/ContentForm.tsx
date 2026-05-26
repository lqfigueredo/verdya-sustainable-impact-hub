import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { adminCategoriesQuery, type ContentItem } from "@/lib/admin";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import i18n from "@/lib/i18n";

// Lazy markdown editor (client-only to avoid SSR window refs)
function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [Comp, setComp] = useState<React.ComponentType<{ value: string; onChange: (v?: string) => void; height?: number; preview?: "edit" | "live" | "preview" }> | null>(null);
  useEffect(() => {
    let active = true;
    import("@uiw/react-md-editor").then((m) => {
      if (active) setComp(() => m.default);
    });
    return () => { active = false; };
  }, []);
  if (!Comp) return <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={12} className="font-mono text-sm" />;
  return <div data-color-mode="light"><Comp value={value} onChange={(v) => onChange(v ?? "")} height={400} preview="edit" /></div>;
}

const schema = z.object({
  title_en: z.string().min(1).max(200),
  title_pt: z.string().min(1).max(200),
  summary_en: z.string().max(500),
  summary_pt: z.string().max(500),
  body_en: z.string(),
  body_pt: z.string(),
  category_id: z.string().uuid(),
  type: z.enum(["article", "guide", "pdf", "link", "video"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  reading_time_min: z.coerce.number().int().min(1).max(600),
  external_url: z.string(),
  cover_image_url: z.string(),
  file_url: z.string(),
  tags: z.array(z.string()),
  published: z.boolean(),
  featured: z.boolean(),
});

export type ContentFormValues = z.infer<typeof schema>;

export function ContentForm({ existing }: { existing?: ContentItem | null }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const cats = useQuery(adminCategoriesQuery);
  const lang = i18n.language;
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState<null | "cover" | "file">(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title_en: existing?.title_en ?? "",
      title_pt: existing?.title_pt ?? "",
      summary_en: existing?.summary_en ?? "",
      summary_pt: existing?.summary_pt ?? "",
      body_en: existing?.body_en ?? "",
      body_pt: existing?.body_pt ?? "",
      category_id: existing?.category_id ?? "",
      type: existing?.type ?? "article",
      difficulty: existing?.difficulty ?? "beginner",
      reading_time_min: existing?.reading_time_min ?? 5,
      external_url: existing?.external_url ?? "",
      cover_image_url: existing?.cover_image_url ?? "",
      file_url: existing?.file_url ?? "",
      tags: existing?.tags ?? [],
      published: existing?.published ?? false,
      featured: existing?.featured ?? false,
    },
  });

  const tags = form.watch("tags");
  const coverUrl = form.watch("cover_image_url");
  const fileUrl = form.watch("file_url");

  const addTag = () => {
    const v = tagInput.trim();
    if (!v) return;
    if (!tags.includes(v)) form.setValue("tags", [...tags, v]);
    setTagInput("");
  };
  const removeTag = (tag: string) => form.setValue("tags", tags.filter((t) => t !== tag));

  const upload = async (file: File, kind: "cover" | "file") => {
    if (!user) return;
    setUploading(kind);
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("content-files").upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      setUploading(null);
      return;
    }
    const { data } = supabase.storage.from("content-files").getPublicUrl(path);
    form.setValue(kind === "cover" ? "cover_image_url" : "file_url", data.publicUrl);
    setUploading(null);
    toast.success(t("admin.toast.uploaded"));
  };

  const submit = async (values: ContentFormValues, publish?: boolean) => {
    if (!user) return;
    setSubmitting(true);
    const payload = { ...values, published: publish ?? values.published, author_id: user.id };
    const op = existing
      ? supabase.from("content_items").update(payload).eq("id", existing.id)
      : supabase.from("content_items").insert(payload);
    const { error } = await op;
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin", "content"] });
    qc.invalidateQueries({ queryKey: ["content"] });
    toast.success(existing ? t("admin.toast.updated") : t("admin.toast.created"));
    navigate({ to: "/admin/content" });
  };

  return (
    <form onSubmit={form.handleSubmit((v) => submit(v))} className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          {existing ? t("admin.form.editTitle") : t("admin.form.newTitle")}
        </h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/content" })}>
            {t("admin.confirm.cancel")}
          </Button>
          <Button type="button" variant="secondary" disabled={submitting} onClick={form.handleSubmit((v) => submit(v, false))}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} {t("admin.form.saveDraft")}
          </Button>
          <Button type="button" disabled={submitting} onClick={form.handleSubmit((v) => submit(v, true))}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} {t("admin.form.publish")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-background p-5">
            <Tabs defaultValue={lang === "pt" ? "pt" : "en"}>
              <TabsList>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="pt">Português</TabsTrigger>
              </TabsList>
              {(["en", "pt"] as const).map((lc) => (
                <TabsContent key={lc} value={lc} className="space-y-4 pt-4">
                  <div>
                    <Label>{t("admin.form.titleField")}</Label>
                    <Input {...form.register(`title_${lc}` as const)} />
                    {form.formState.errors[`title_${lc}` as const] && (
                      <p className="mt-1 text-xs text-destructive">{t("admin.form.required")}</p>
                    )}
                  </div>
                  <div>
                    <Label>{t("admin.form.summary")}</Label>
                    <Textarea rows={3} {...form.register(`summary_${lc}` as const)} />
                  </div>
                  <div>
                    <Label>{t("admin.form.body")}</Label>
                    <MarkdownEditor
                      value={form.watch(`body_${lc}` as const) ?? ""}
                      onChange={(v) => form.setValue(`body_${lc}` as const, v)}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-4 rounded-xl border bg-background p-5">
            <div>
              <Label>{t("admin.form.category")}</Label>
              <Select value={form.watch("category_id")} onValueChange={(v) => form.setValue("category_id", v)}>
                <SelectTrigger><SelectValue placeholder={t("admin.form.selectCategory")} /></SelectTrigger>
                <SelectContent>
                  {(cats.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{lang === "pt" ? c.name_pt : c.name_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("admin.form.type")}</Label>
              <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as ContentFormValues["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["article", "guide", "pdf", "link", "video"] as const).map((v) => (
                    <SelectItem key={v} value={v}>{t(`library.types.${v}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("admin.form.difficulty")}</Label>
              <Select value={form.watch("difficulty")} onValueChange={(v) => form.setValue("difficulty", v as ContentFormValues["difficulty"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["beginner", "intermediate", "advanced"] as const).map((v) => (
                    <SelectItem key={v} value={v}>{t(`library.difficulty.${v}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("admin.form.readingTime")}</Label>
              <Input type="number" min={1} {...form.register("reading_time_min")} />
            </div>
            <div>
              <Label>{t("admin.form.externalUrl")}</Label>
              <Input type="url" placeholder="https://" {...form.register("external_url")} />
            </div>
            <div>
              <Label>{t("admin.form.tags")}</Label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder={t("admin.form.addTag")}
                />
                <Button type="button" variant="outline" onClick={addTag}>+</Button>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border bg-background p-5">
            <div>
              <Label>{t("admin.form.cover")}</Label>
              {coverUrl && <img src={coverUrl} alt="" className="mt-2 h-32 w-full rounded object-cover" />}
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 py-3 text-sm text-muted-foreground hover:bg-muted/50">
                {uploading === "cover" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading === "cover" ? t("admin.form.uploading") : t("admin.form.uploadCover")}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")} />
              </label>
            </div>
            <div>
              <Label>{t("admin.form.file")}</Label>
              {fileUrl && <p className="mt-1 truncate text-xs text-muted-foreground">{fileUrl.split("/").pop()}</p>}
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 py-3 text-sm text-muted-foreground hover:bg-muted/50">
                {uploading === "file" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading === "file" ? t("admin.form.uploading") : t("admin.form.uploadFile")}
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "file")} />
              </label>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border bg-background p-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="published">{t("admin.form.published")}</Label>
              <Switch id="published" checked={form.watch("published")} onCheckedChange={(v) => form.setValue("published", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="featured">{t("admin.form.featured")}</Label>
              <Switch id="featured" checked={form.watch("featured")} onCheckedChange={(v) => form.setValue("featured", v)} />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
