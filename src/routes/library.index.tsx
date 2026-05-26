import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ContentCard } from "@/components/library/ContentCard";
import { Filters } from "@/components/library/Filters";
import { categoriesQuery, contentListQuery, type ContentType, type Difficulty } from "@/lib/library";

export const Route = createFileRoute("/library/")({
  head: () => ({
    meta: [
      { title: "Library — Verdya" },
      { name: "description", content: "Browse the Verdya ESG education library: articles, guides, PDFs and curated resources." },
    ],
  }),
  component: LibraryIndex,
});

function LibraryIndex() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [type, setType] = useState<ContentType | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: items = [], isLoading } = useQuery(
    contentListQuery({ search, categoryId, type, difficulty, tag }),
  );

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.tags.forEach((tg) => s.add(tg)));
    return Array.from(s).sort();
  }, [items]);

  return (
    <Layout>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t("library.eyebrow")}</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-foreground lg:text-5xl">
            {t("library.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t("library.subtitle")}</p>
          <form
            className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-border bg-background p-1.5 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput);
            }}
          >
            <Search className="ml-3 h-4 w-4 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("library.searchPlaceholder")}
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("library.searchButton")}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <Filters
            categories={categories}
            categoryId={categoryId}
            type={type}
            difficulty={difficulty}
            tag={tag}
            allTags={allTags}
            onChange={(n) => {
              if ("categoryId" in n) setCategoryId(n.categoryId ?? null);
              if ("type" in n) setType(n.type ?? null);
              if ("difficulty" in n) setDifficulty(n.difficulty ?? null);
              if ("tag" in n) setTag(n.tag ?? null);
            }}
          />
          <div>
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                {t("library.empty")}
              </div>
            ) : (
              <>
                <p className="mb-6 text-sm text-muted-foreground">
                  {items.length} {t("library.results")}
                </p>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <ContentCard key={item.id} item={item} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
