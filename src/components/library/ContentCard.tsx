import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Clock, FileText, Link as LinkIcon, PlayCircle, BookOpen, FileDown } from "lucide-react";
import type { ContentWithCategory } from "@/lib/library";
import { pickLang } from "@/lib/library";

const typeIcon = {
  article: BookOpen,
  guide: FileText,
  pdf: FileDown,
  link: LinkIcon,
  video: PlayCircle,
} as const;

const difficultyStyles: Record<string, string> = {
  beginner: "bg-secondary/40 text-foreground",
  intermediate: "bg-accent/20 text-accent-foreground",
  advanced: "bg-primary/15 text-primary",
};

export function ContentCard({ item }: { item: ContentWithCategory }) {
  const { i18n, t } = useTranslation();
  const lang = i18n.language.startsWith("pt") ? "pt" : "en";
  const title = pickLang(item, "title", lang);
  const summary = pickLang(item, "summary", lang);
  const Icon = typeIcon[item.type] ?? BookOpen;
  const catName = item.category ? pickLang(item.category, "name", lang) : "";
  const color = item.category?.color ?? "#1F4D3A";

  return (
    <Link
      to="/library/$contentId"
      params={{ contentId: item.id }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
      {item.cover_image_url ? (
        <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
          <img src={item.cover_image_url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        </div>
      ) : (
        <div
          className="grid aspect-[16/9] w-full place-items-center"
          style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)` }}
        >
          <Icon className="h-10 w-10" style={{ color }} />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium"
            style={{ backgroundColor: `${color}1a`, color }}
          >
            <Icon className="h-3 w-3" /> {t(`library.types.${item.type}`)}
          </span>
          <span className={`rounded-full px-2 py-0.5 ${difficultyStyles[item.difficulty]}`}>
            {t(`library.difficulty.${item.difficulty}`)}
          </span>
          {catName && <span className="text-muted-foreground">· {catName}</span>}
        </div>
        <h3 className="font-serif text-lg leading-snug text-foreground group-hover:text-primary">{title}</h3>
        {summary && <p className="line-clamp-2 text-sm text-muted-foreground">{summary}</p>}
        <div className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> {item.reading_time_min} {t("library.minRead")}
        </div>
      </div>
    </Link>
  );
}
