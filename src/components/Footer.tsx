import { useTranslation } from "react-i18next";
import { Leaf, Linkedin, Twitter, Instagram, Youtube } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();

  const columns = [
    { title: t("footer.about"), links: t("footer.aboutLinks", { returnObjects: true }) as string[] },
    { title: t("footer.explore"), links: t("footer.exploreLinks", { returnObjects: true }) as string[] },
    { title: t("footer.legal"), links: t("footer.legalLinks", { returnObjects: true }) as string[] },
  ];

  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Leaf className="h-4 w-4" />
              </span>
              <span className="font-serif text-xl font-semibold">Verdya</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <div className="mt-6 flex gap-3">
              {[Linkedin, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="font-serif text-sm font-semibold text-foreground">{col.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-muted-foreground transition hover:text-foreground">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>{t("footer.rights")}</p>
          <p className="font-serif italic">Calm. Considered. Climate-positive.</p>
        </div>
      </div>
    </footer>
  );
}
