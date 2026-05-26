import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";

type Card = { tag: string; title: string; meta: string };

export function Featured() {
  const { t } = useTranslation();
  const cards = t("featured.cards", { returnObjects: true }) as Card[];

  const gradients = [
    "from-primary/90 to-secondary/70",
    "from-accent/80 to-primary/70",
    "from-secondary/80 to-primary/80",
  ];

  return (
    <section id="content" className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-wider text-accent">
            {t("featured.eyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
            {t("featured.title")}
          </h2>
        </div>
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
        >
          {t("featured.viewAll")}
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {cards.map((card, i) => (
          <article
            key={i}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-1 hover:shadow-glow"
          >
            <div className={`aspect-[4/3] bg-gradient-to-br ${gradients[i % gradients.length]} relative`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
              <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground">
                {card.tag}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-serif text-xl font-medium leading-snug">{card.title}</h3>
              <p className="mt-auto pt-6 text-xs uppercase tracking-wider text-muted-foreground">
                {card.meta}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
