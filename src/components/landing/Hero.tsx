import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      {/* organic background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute top-20 right-0 h-[520px] w-[520px] rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 md:py-32 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" />
            {t("hero.eyebrow")}
          </span>
          <h1 className="mt-6 font-serif text-5xl font-medium leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
            {t("hero.title")}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("hero.subtitle")}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition hover:bg-primary/90">
              {t("hero.ctaPrimary")}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground transition hover:border-primary/40">
              {t("hero.ctaSecondary")}
            </button>
          </div>

          <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-border/60 pt-8">
            {(["stat1", "stat2", "stat3"] as const).map((k) => (
              <div key={k}>
                <dt className="font-serif text-2xl font-semibold text-foreground">
                  {t(`hero.${k}`).split(" ")[0]}
                </dt>
                <dd className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {t(`hero.${k}`).split(" ").slice(1).join(" ")}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Organic illustration */}
        <div className="relative lg:col-span-5">
          <div className="relative aspect-square w-full max-w-md mx-auto">
            <div className="absolute inset-0 rounded-[42%_58%_38%_62%/55%_45%_55%_45%] bg-gradient-to-br from-primary via-primary to-secondary shadow-glow" />
            <div className="absolute inset-6 rounded-[58%_42%_55%_45%/42%_58%_42%_58%] bg-gradient-to-tr from-accent/80 to-secondary/60 mix-blend-multiply opacity-90" />
            <div className="absolute inset-16 rounded-[40%_60%_60%_40%/60%_40%_60%_40%] bg-background/40 backdrop-blur-sm" />
            <div className="absolute bottom-6 right-6 rounded-2xl border border-border/80 bg-surface/95 p-4 shadow-soft backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-secondary/40" />
                <div>
                  <p className="text-xs font-medium text-foreground">Marina S.</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Head of ESG · São Paulo
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute top-8 left-0 rounded-2xl border border-border/80 bg-surface/95 px-4 py-2.5 shadow-soft backdrop-blur-md">
              <p className="text-xs font-medium text-foreground">Live circle · 12 peers</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
