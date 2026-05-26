import { useTranslation } from "react-i18next";
import { useState } from "react";

export function Newsletter() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section id="resources" className="mx-auto max-w-7xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-primary-foreground md:px-16 md:py-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-secondary/30 blur-3xl" />

        <div className="relative max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-secondary">
            {t("newsletter.eyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
            {t("newsletter.title")}
          </h2>
          <p className="mt-4 max-w-lg text-base text-primary-foreground/80">
            {t("newsletter.subtitle")}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletter.placeholder")}
              className="flex-1 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-5 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:border-primary-foreground/40 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition hover:bg-accent/90"
            >
              {sent ? "✓" : t("newsletter.button")}
            </button>
          </form>
          <p className="mt-4 text-xs text-primary-foreground/60">{t("newsletter.disclaimer")}</p>
        </div>
      </div>
    </section>
  );
}
