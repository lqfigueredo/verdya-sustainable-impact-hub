import { useTranslation } from "react-i18next";

type Step = { title: string; desc: string };

export function HowItWorks() {
  const { t } = useTranslation();
  const steps = t("how.steps", { returnObjects: true }) as Step[];

  return (
    <section id="community" className="border-t border-border/60 bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-accent">
            {t("how.eyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
            {t("how.title")}
          </h2>
        </div>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={i} className="relative bg-background p-8">
              <span className="font-serif text-5xl font-medium text-primary/20">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-serif text-xl font-medium">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
