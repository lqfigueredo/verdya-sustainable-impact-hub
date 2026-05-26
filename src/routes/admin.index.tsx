import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FileText, Users, CheckCircle2, FileEdit, Plus } from "lucide-react";
import { adminStatsQuery, adminRecentActivityQuery } from "@/lib/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function StatCard({ label, value, icon: Icon, loading }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-semibold">{value}</div>}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { t } = useTranslation();
  const stats = useQuery(adminStatsQuery);
  const recent = useQuery(adminRecentActivityQuery);
  const lang = i18n.language;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">{t("admin.dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.dashboard.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/content/new" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> {t("admin.dashboard.newContent")}
          </Link>
          <Link to="/admin/categories" className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
            <Plus className="h-4 w-4" /> {t("admin.dashboard.newCategory")}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("admin.dashboard.totalContent")} value={stats.data?.totalContent ?? 0} icon={FileText} loading={stats.isLoading} />
        <StatCard label={t("admin.dashboard.totalUsers")} value={stats.data?.totalUsers ?? 0} icon={Users} loading={stats.isLoading} />
        <StatCard label={t("admin.dashboard.publishedMonth")} value={stats.data?.publishedThisMonth ?? 0} icon={CheckCircle2} loading={stats.isLoading} />
        <StatCard label={t("admin.dashboard.drafts")} value={stats.data?.drafts ?? 0} icon={FileEdit} loading={stats.isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dashboard.recent")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (recent.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.dashboard.noActivity")}</p>
          ) : (
            <ul className="divide-y">
              {recent.data!.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link to="/admin/content/$id/edit" params={{ id: c.id }} className="block truncate text-sm font-medium hover:underline">
                      {lang === "pt" ? c.title_pt : c.title_en}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.type} · {c.author?.full_name ?? c.author?.email ?? "—"} · {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={c.published ? "default" : "secondary"}>
                    {c.published ? t("admin.status.published") : t("admin.status.draft")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
