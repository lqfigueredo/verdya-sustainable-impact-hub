import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SocialButtons } from "@/components/auth/SocialButtons";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/" }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(t("auth.errors.invalid"));
      return;
    }
    toast.success(t("auth.success.signedIn"));
    navigate({ to: search.redirect || "/" });
  };

  return (
    <AuthLayout title={t("auth.login.title")} subtitle={t("auth.login.subtitle")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("auth.login.email")}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("auth.login.password")}</label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">{t("auth.login.forgot")}</Link>
          </div>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
        </div>
        <button type="submit" disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? t("auth.login.submitting") : t("auth.login.submit")}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{t("auth.login.or")}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <SocialButtons />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.login.noAccount")}{" "}
        <Link to="/signup" className="font-medium text-foreground hover:text-primary">{t("auth.login.signupLink")}</Link>
      </p>
    </AuthLayout>
  );
}
