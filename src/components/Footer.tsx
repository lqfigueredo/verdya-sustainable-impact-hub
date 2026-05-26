import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Leaf, Linkedin, Twitter } from "lucide-react";

type LinkItem = { label: string; to: string };

export function Footer() {
  const { t } = useTranslation();

  const aboutLabels = t("footer.aboutLinks", { returnObjects: true }) as string[];
  const exploreLabels = t("footer.exploreLinks", { returnObjects: true }) as string[];
  const legalLabels = t("footer.legalLinks", { returnObjects: true }) as string[];

  const columns: { title: string; links: LinkItem[] }[] = [
    {
      title: t("footer.about"),
      links: [
        { label: aboutLabels[0] ?? "Our story", to: "/" },
        { label: aboutLabels[1] ?? "Team", to: "/" },
        { label: aboutLabels[2] ?? "Careers", to: "/" },
        { label: aboutLabels[3] ?? "Press", to: "/newsletter" },
      ],
    },
    {
      title: t("footer.explore"),
      links: [
        { label: exploreLabels[0] ?? "Content", to: "/library" },
        { label: exploreLabels[1] ?? "Programs", to: "/library" },
        { label: exploreLabels[2] ?? "Community", to: "/community" },
        { label: exploreLabels[3] ?? "Events", to: "/events" },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { label: legalLabels[0] ?? "Privacy", to: "/" },
        { label: legalLabels[1] ?? "Terms", to: "/" },
        { label: legalLabels[2] ?? "Cookies", to: "/" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Leaf className="h-4 w-4" />
              </span>
              <span className="font-serif text-xl font-semibold">Verdya</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="font-serif text-sm font-semibold text-foreground">{col.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="text-sm text-muted-foreground transition hover:text-foreground"
                      >
                        {l.label}
                      </Link>
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
