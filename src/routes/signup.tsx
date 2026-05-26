import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SocialButtons } from "@/components/auth/SocialButtons";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error(t("auth.signup.tooShort"));
    if (password !== confirm) return toast.error(t("auth.signup.mismatch"));

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("already")) toast.error(t("auth.errors.exists"));
      else toast.error(t("auth.errors.generic"));
      return;
    }
    toast.success(t("auth.signup.checkEmail"));
    navigate({ to: "/login" });
  };

  const field = (label: string, type: string, value: string, set: (v: string) => void) => (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <input type={type} required value={value} onChange={(e) => set(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-input bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
    </div>
  );

  return (
    <AuthLayout title={t("auth.signup.title")} subtitle={t("auth.signup.subtitle")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {field(t("auth.signup.fullName"), "text", fullName, setFullName)}
        {field(t("auth.signup.email"), "email", email, setEmail)}
        {field(t("auth.signup.password"), "password", password, setPassword)}
        {field(t("auth.signup.confirmPassword"), "password", confirm, setConfirm)}
        <button type="submit" disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? t("auth.signup.submitting") : t("auth.signup.submit")}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{t("auth.login.or")}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <SocialButtons />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.signup.haveAccount")}{" "}
        <Link to="/login" className="font-medium text-foreground hover:text-primary">{t("auth.signup.loginLink")}</Link>
      </p>
    </AuthLayout>
  );
}
