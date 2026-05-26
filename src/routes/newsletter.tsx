import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { subscribe } from "@/lib/newsletter";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/newsletter")({
  head: () => ({
    meta: [
      { title: "Newsletter — Verdya" },
      { name: "description", content: "Monthly ESG insights, frameworks and event invites — in your inbox." },
    ],
  }),
  component: NewsletterPage,
});

function NewsletterPage() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await subscribe(email, (i18n.language?.startsWith("pt") ? "pt" : "en"));
      setDone(true);
      toast.success(t("newsletterPage.success"));
    } catch {
      toast.error(t("newsletterPage.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="mx-auto max-w-2xl px-6 py-24">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-serif text-4xl font-medium tracking-tight md:text-5xl">{t("newsletterPage.title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("newsletterPage.subtitle")}</p>

        {done ? (
          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-sm">
            {t("newsletterPage.success")}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletter.placeholder")}
              className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm focus:border-primary/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "…" : t("newsletter.button")}
            </button>
          </form>
        )}
        <p className="mt-4 text-xs text-muted-foreground">{t("newsletter.disclaimer")}</p>
      </section>
    </Layout>
  );
}
