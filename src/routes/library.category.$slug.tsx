import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ContentCard } from "@/components/library/ContentCard";
import { Filters } from "@/components/library/Filters";
import {
  categoriesQuery,
  categoryBySlugQuery,
  contentListQuery,
  pickLang,
  type ContentType,
  type Difficulty,
} from "@/lib/library";

export const Route = createFileRoute("/library/category/$slug")({
  component: CategoryPage,
  notFoundComponent: () => (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl">Category not found</h1>
        <Link to="/library" className="mt-4 inline-block text-primary underline">
          Back to library
        </Link>
      </div>
    </Layout>
  ),
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("pt") ? "pt" : "en";

  const { data: category, isLoading: catLoading } = useQuery(categoryBySlugQuery(slug));
  const { data: categories = [] } = useQuery(categoriesQuery);

  const [type, setType] = useState<ContentType | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    ...contentListQuery({ categoryId: category?.id ?? undefined, type, difficulty, tag }),
    enabled: !!category?.id,
  });

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.tags.forEach((tg) => s.add(tg)));
    return Array.from(s).sort();
  }, [items]);

  if (!catLoading && !category) throw notFound();

  const color = category?.color ?? "#1F4D3A";

  return (
    <Layout>
      <section className="border-b border-border" style={{ background: `linear-gradient(135deg, ${color}22, transparent)` }}>
        <div className="mx-auto max-w-7xl px-6 py-16">
          <Link to="/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> {t("library.backToLibrary")}
          </Link>
          {category && (
            <>
              <h1 className="mt-4 font-serif text-4xl text-foreground lg:text-5xl">{pickLang(category, "name", lang)}</h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{pickLang(category, "description", lang)}</p>
            </>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <Filters
            categories={categories}
            categoryId={category?.id ?? null}
            type={type}
            difficulty={difficulty}
            tag={tag}
            allTags={allTags}
            hideCategory
            onChange={(n) => {
              if ("type" in n) setType(n.type ?? null);
              if ("difficulty" in n) setDifficulty(n.difficulty ?? null);
              if ("tag" in n) setTag(n.tag ?? null);
            }}
          />
          <div>
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                {t("library.empty")}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <ContentCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
