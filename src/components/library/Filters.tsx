import { useTranslation } from "react-i18next";
import type { Category, ContentType, Difficulty } from "@/lib/library";
import { pickLang } from "@/lib/library";

type Props = {
  categories: Category[];
  categoryId: string | null;
  type: ContentType | null;
  difficulty: Difficulty | null;
  tag: string | null;
  allTags: string[];
  onChange: (next: Partial<{ categoryId: string | null; type: ContentType | null; difficulty: Difficulty | null; tag: string | null }>) => void;
  hideCategory?: boolean;
};

const types: ContentType[] = ["article", "guide", "pdf", "link", "video"];
const difficulties: Difficulty[] = ["beginner", "intermediate", "advanced"];

export function Filters({ categories, categoryId, type, difficulty, tag, allTags, onChange, hideCategory }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("pt") ? "pt" : "en";

  return (
    <aside className="space-y-8 lg:sticky lg:top-24">
      {!hideCategory && (
        <FilterGroup label={t("library.filters.category")}>
          <Chip active={!categoryId} onClick={() => onChange({ categoryId: null })}>{t("library.filters.all")}</Chip>
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={categoryId === c.id}
              color={c.color}
              onClick={() => onChange({ categoryId: categoryId === c.id ? null : c.id })}
            >
              {pickLang(c, "name", lang)}
            </Chip>
          ))}
        </FilterGroup>
      )}

      <FilterGroup label={t("library.filters.type")}>
        <Chip active={!type} onClick={() => onChange({ type: null })}>{t("library.filters.all")}</Chip>
        {types.map((tp) => (
          <Chip key={tp} active={type === tp} onClick={() => onChange({ type: type === tp ? null : tp })}>
            {t(`library.types.${tp}`)}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup label={t("library.filters.difficulty")}>
        <Chip active={!difficulty} onClick={() => onChange({ difficulty: null })}>{t("library.filters.all")}</Chip>
        {difficulties.map((d) => (
          <Chip key={d} active={difficulty === d} onClick={() => onChange({ difficulty: difficulty === d ? null : d })}>
            {t(`library.difficulty.${d}`)}
          </Chip>
        ))}
      </FilterGroup>

      {allTags.length > 0 && (
        <FilterGroup label={t("library.filters.tag")}>
          <Chip active={!tag} onClick={() => onChange({ tag: null })}>{t("library.filters.all")}</Chip>
          {allTags.map((tg) => (
            <Chip key={tg} active={tag === tg} onClick={() => onChange({ tag: tag === tg ? null : tg })}>
              #{tg}
            </Chip>
          ))}
        </FilterGroup>
      )}
    </aside>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, color, onClick, children }: { active?: boolean; color?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
      style={active && color ? { backgroundColor: color, borderColor: color, color: "#fff" } : undefined}
    >
      {children}
    </button>
  );
}
