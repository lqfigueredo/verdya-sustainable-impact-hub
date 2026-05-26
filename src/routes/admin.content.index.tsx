import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { adminContentListQuery, adminCategoriesQuery } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/admin/content/")({
  component: ContentManager,
});

function ContentManager() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const lang = i18n.language;
  const items = useQuery(adminContentListQuery);
  const cats = useQuery(adminCategoriesQuery);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState<"delete" | null>(null);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return (items.data ?? []).filter((c) => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (catFilter !== "all" && c.category_id !== catFilter) return false;
      if (statusFilter !== "all" && (statusFilter === "published") !== c.published) return false;
      if (s && !`${c.title_en} ${c.title_pt}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [items.data, search, typeFilter, catFilter, statusFilter]);

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, published }: { ids: string[]; published: boolean }) => {
      const { error } = await supabase.from("content_items").update({ published }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "content"] });
      setSelected(new Set());
      toast.success(t("admin.toast.updated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("content_items").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "content"] });
      setSelected(new Set());
      setBulkConfirm(null);
      toast.success(t("admin.toast.deleted"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "content"] });
      setPendingDelete(null);
      toast.success(t("admin.toast.deleted"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.id)));
  };
  const toggle = (id: string) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">{t("admin.content.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.content.subtitle")}</p>
        </div>
        <Button onClick={() => navigate({ to: "/admin/content/new" })}>
          <Plus className="h-4 w-4" /> {t("admin.content.new")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-background p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("admin.content.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.filters.allTypes")}</SelectItem>
            {(["article", "guide", "pdf", "link", "video"] as const).map((v) => (
              <SelectItem key={v} value={v}>{t(`library.types.${v}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.filters.allCategories")}</SelectItem>
            {(cats.data ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>{lang === "pt" ? c.name_pt : c.name_en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.filters.allStatus")}</SelectItem>
            <SelectItem value="published">{t("admin.status.published")}</SelectItem>
            <SelectItem value="draft">{t("admin.status.draft")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-xl border bg-accent/40 p-3 text-sm">
          <span className="text-muted-foreground">{t("admin.bulk.selected", { count: selected.size })}</span>
          <Button size="sm" variant="outline" onClick={() => bulkUpdate.mutate({ ids: Array.from(selected), published: true })}>
            {t("admin.bulk.publish")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkUpdate.mutate({ ids: Array.from(selected), published: false })}>
            {t("admin.bulk.unpublish")}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setBulkConfirm("delete")}>
            {t("admin.bulk.delete")}
          </Button>
        </div>
      )}

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></TableHead>
              <TableHead className="w-16">{t("admin.content.cover")}</TableHead>
              <TableHead>{t("admin.content.titleCol")}</TableHead>
              <TableHead>{t("admin.content.type")}</TableHead>
              <TableHead>{t("admin.content.category")}</TableHead>
              <TableHead>{t("admin.content.status")}</TableHead>
              <TableHead>{t("admin.content.author")}</TableHead>
              <TableHead>{t("admin.content.created")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">{t("admin.content.empty")}</TableCell></TableRow>
            ) : filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell><Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} /></TableCell>
                <TableCell>
                  {c.cover_image_url ? (
                    <img src={c.cover_image_url} alt="" className="h-10 w-14 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-14 rounded bg-muted" style={{ backgroundColor: c.category?.color }} />
                  )}
                </TableCell>
                <TableCell className="max-w-xs">
                  <Link to="/admin/content/$id/edit" params={{ id: c.id }} className="line-clamp-1 font-medium hover:underline">
                    {lang === "pt" ? c.title_pt : c.title_en}
                  </Link>
                </TableCell>
                <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                <TableCell>{c.category ? (lang === "pt" ? c.category.name_pt : c.category.name_en) : "—"}</TableCell>
                <TableCell>
                  <Badge variant={c.published ? "default" : "secondary"}>
                    {c.published ? t("admin.status.published") : t("admin.status.draft")}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.author?.full_name ?? c.author?.email ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => navigate({ to: "/admin/content/$id/edit", params: { id: c.id } })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setPendingDelete(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.confirm.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.confirm.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingDelete && deleteOne.mutate(pendingDelete)}>{t("admin.confirm.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!bulkConfirm} onOpenChange={(o) => !o && setBulkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.confirm.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.bulk.confirmDelete", { count: selected.size })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkDelete.mutate(Array.from(selected))}>{t("admin.confirm.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
