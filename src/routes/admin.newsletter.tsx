import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, Mail, Send, TestTube2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { adminSubscribersQuery, adminCampaignsQuery, subscribersToCSV, downloadCSV } from "@/lib/newsletter";
import { sendNewsletterCampaign } from "@/lib/email.functions";

export const Route = createFileRoute("/admin/newsletter")({
  component: AdminNewsletterPage,
});

function AdminNewsletterPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: subscribers } = useQuery(adminSubscribersQuery);
  const { data: campaigns } = useQuery(adminCampaignsQuery);
  const send = useServerFn(sendNewsletterCampaign);

  const [tab, setTab] = useState<"subscribers" | "compose" | "history">("subscribers");
  const [form, setForm] = useState({ subject_en: "", subject_pt: "", body_en: "", body_pt: "" });
  const [busy, setBusy] = useState<"test" | "all" | null>(null);

  const active = (subscribers ?? []).filter((s) => !s.unsubscribed_at);

  const saveDraft = async () => {
    const { data, error } = await supabase
      .from("newsletter_campaigns")
      .insert({
        subject_en: form.subject_en,
        subject_pt: form.subject_pt,
        body_en: form.body_en,
        body_pt: form.body_pt,
        created_by: user?.id,
      })
      .select()
      .single();
    if (error) {
      toast.error(t("adminNewsletter.errorSave"));
      return null;
    }
    qc.invalidateQueries({ queryKey: ["admin", "newsletter", "campaigns"] });
    return data;
  };

  const sendTest = async () => {
    if (!user?.email) return;
    setBusy("test");
    try {
      await send({
        data: {
          subjectEn: form.subject_en,
          subjectPt: form.subject_pt,
          bodyEn: form.body_en,
          bodyPt: form.body_pt,
          testTo: user.email,
        },
      });
      toast.success(t("adminNewsletter.testSent"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const sendAll = async () => {
    if (!confirm(t("adminNewsletter.confirmAll", { count: active.length }))) return;
    setBusy("all");
    try {
      const draft = await saveDraft();
      const res = await send({
        data: {
          campaignId: draft?.id,
          subjectEn: form.subject_en,
          subjectPt: form.subject_pt,
          bodyEn: form.body_en,
          bodyPt: form.body_pt,
        },
      });
      toast.success(t("adminNewsletter.sentAll", { count: res.sent }));
      setForm({ subject_en: "", subject_pt: "", body_en: "", body_pt: "" });
      setTab("history");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl font-medium tracking-tight">{t("adminNewsletter.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("adminNewsletter.subtitle")}</p>
      </header>

      <div className="flex gap-1 border-b border-border">
        {(["subscribers", "compose", "history"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm transition ${
              tab === k ? "border-b-2 border-primary font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`adminNewsletter.tabs.${k}`)}
          </button>
        ))}
      </div>

      {tab === "subscribers" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("adminNewsletter.total", { count: active.length })}
            </p>
            <button
              onClick={() => downloadCSV("verdya-subscribers.csv", subscribersToCSV(subscribers ?? []))}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-primary/40"
            >
              <Download className="h-4 w-4" /> {t("adminNewsletter.exportCsv")}
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Lang</th>
                  <th className="px-4 py-2">{t("adminNewsletter.subscribedAt")}</th>
                  <th className="px-4 py-2">{t("adminNewsletter.status")}</th>
                </tr>
              </thead>
              <tbody>
                {(subscribers ?? []).map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-2">{s.email}</td>
                    <td className="px-4 py-2 uppercase">{s.language_pref}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(s.subscribed_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {s.unsubscribed_at ? (
                        <span className="text-destructive">{t("adminNewsletter.unsub")}</span>
                      ) : (
                        <span className="text-primary">{t("adminNewsletter.active")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "compose" && (
        <section className="space-y-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <strong className="block">{t("adminNewsletter.resendTitle")}</strong>
            {t("adminNewsletter.resendNote")}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("adminNewsletter.subjectEn")} value={form.subject_en} onChange={(v) => setForm((f) => ({ ...f, subject_en: v }))} />
            <Field label={t("adminNewsletter.subjectPt")} value={form.subject_pt} onChange={(v) => setForm((f) => ({ ...f, subject_pt: v }))} />
            <TextArea label={t("adminNewsletter.bodyEn")} value={form.body_en} onChange={(v) => setForm((f) => ({ ...f, body_en: v }))} />
            <TextArea label={t("adminNewsletter.bodyPt")} value={form.body_pt} onChange={(v) => setForm((f) => ({ ...f, body_pt: v }))} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={sendTest}
              disabled={busy !== null || !form.subject_en || !form.body_en}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm hover:border-primary/40 disabled:opacity-50"
            >
              {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
              {t("adminNewsletter.sendTest")}
            </button>
            <button
              onClick={sendAll}
              disabled={busy !== null || active.length === 0 || !form.subject_en || !form.body_en}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busy === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t("adminNewsletter.sendAll", { count: active.length })}
            </button>
          </div>
        </section>
      )}

      {tab === "history" && (
        <section className="space-y-3">
          {(campaigns ?? []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              {t("adminNewsletter.noHistory")}
            </p>
          ) : (
            (campaigns ?? []).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <div className="font-medium">{c.subject_en}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.sent_at ? new Date(c.sent_at).toLocaleString() : t("adminNewsletter.draft")} ·{" "}
                    {t("adminNewsletter.recipients", { count: c.recipients_count })} ·{" "}
                    {t("adminNewsletter.opens", { count: c.open_count })}
                  </div>
                </div>
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary/40 focus:outline-none"
      />
    </label>
  );
}
