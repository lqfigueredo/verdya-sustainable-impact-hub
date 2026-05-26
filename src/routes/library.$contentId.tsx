import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Clock, ExternalLink, FileDown } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ContentCard } from "@/components/library/ContentCard";
import { FavoriteButton } from "@/components/library/FavoriteButton";
import { contentItemQuery, pickLang, relatedContentQuery } from "@/lib/library";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/library/$contentId")({
  component: ContentPage,
});

function ContentPage() {
  const { contentId } = Route.useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("pt") ? "pt" : "en";

  const { data: item, isLoading } = useQuery(contentItemQuery(contentId));
  const { data: related = [] } = useQuery({
    ...relatedContentQuery(item?.category_id ?? "", contentId),
    enabled: !!item?.category_id,
  });

  const [author, setAuthor] = useState<{ full_name: string | null; avatar_url: string | null; company: string | null } | null>(null);
  useEffect(() => {
    if (!item?.author_id) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url, company")
      .eq("id", item.author_id)
      .maybeSingle()
      .then(({ data }) => setAuthor(data));
  }, [item?.author_id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        </div>
      </Layout>
    );
  }
  if (!item) throw notFound();

  const title = pickLang(item, "title", lang);
  const summary = pickLang(item, "summary", lang);
  const body = pickLang(item, "body", lang);
  const color = item.category?.color ?? "#1F4D3A";
  const ytId = item.type === "video" && item.external_url ? extractYouTubeId(item.external_url) : null;

  return (
    <Layout>
      <article className="border-b border-border" style={{ background: `linear-gradient(180deg, ${color}14, transparent)` }}>
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link to="/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> {t("library.backToLibrary")}
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            {item.category && (
              <Link
                to="/library/category/$slug"
                params={{ slug: item.category.slug }}
                className="rounded-full px-2.5 py-1 font-medium"
                style={{ backgroundColor: `${color}1a`, color }}
              >
                {pickLang(item.category, "name", lang)}
              </Link>
            )}
            <span className="rounded-full bg-muted px-2.5 py-1">{t(`library.types.${item.type}`)}</span>
            <span className="rounded-full bg-muted px-2.5 py-1">{t(`library.difficulty.${item.difficulty}`)}</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" /> {item.reading_time_min} {t("library.minRead")}
            </span>
          </div>

          <h1 className="mt-5 font-serif text-4xl leading-tight text-foreground lg:text-5xl">{title}</h1>
          {summary && <p className="mt-4 text-xl text-muted-foreground">{summary}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <FavoriteButton contentId={item.id} />
            {item.external_url && (item.type === "link" || item.type === "video") && (
              <a
                href={item.external_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <ExternalLink className="h-4 w-4" /> {t("library.openExternal")}
              </a>
            )}
            {item.file_url && item.type === "pdf" && (
              <a
                href={item.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <FileDown className="h-4 w-4" /> {t("library.download")}
              </a>
            )}
          </div>
        </div>
      </article>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[1fr_280px]">
        <div>
          {item.cover_image_url && (
            <img src={item.cover_image_url} alt="" className="mb-8 w-full rounded-2xl object-cover" />
          )}

          {item.type === "pdf" && item.file_url && (
            <iframe src={item.file_url} title={title} className="mb-8 h-[80vh] w-full rounded-2xl border border-border" />
          )}

          {ytId && (
            <div className="mb-8 aspect-video w-full overflow-hidden rounded-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title={title}
                className="h-full w-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          {body && (
            <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground/85 prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </div>
          )}
        </div>

        <aside className="space-y-8">
          {author && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("library.author")}</p>
              <div className="mt-3 flex items-center gap-3">
                {author.avatar_url ? (
                  <img src={author.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {(author.full_name ?? "?")[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{author.full_name ?? "—"}</p>
                  {author.company && <p className="text-xs text-muted-foreground">{author.company}</p>}
                </div>
              </div>
            </div>
          )}

          {item.tags.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("library.tags")}</p>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tg) => (
                  <span key={tg} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    #{tg}
                  </span>
                ))}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("library.related")}</p>
              <div className="space-y-4">
                {related.map((r) => (
                  <ContentCard key={r.id} item={r} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </Layout>
  );
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}
