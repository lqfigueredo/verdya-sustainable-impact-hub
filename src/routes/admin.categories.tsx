import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from "sonner";
import * as Lucide from "lucide-react";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { adminCategoriesQuery, type Category } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});

type FormState = Partial<Category> & { isNew?: boolean };

function getIcon(name: string) {
  const Icon = (Lucide as unknown as Record<string, Lucide.LucideIcon>)[name];
  return Icon ?? Lucide.Leaf;
}

function CategoriesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const lang = i18n.language;
  const { data, isLoading } = useQuery(adminCategoriesQuery);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const reorder = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, idx) => supabase.from("categories").update({ order: idx }).eq("id", id)),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async (v: FormState) => {
      const payload = {
        slug: v.slug!,
        name_en: v.name_en!,
        name_pt: v.name_pt!,
        description_en: v.description_en ?? null,
        description_pt: v.description_pt ?? null,
        icon: v.icon || "Leaf",
        color: v.color || "#1F4D3A",
        order: v.order ?? (data?.length ?? 0),
      };
      if (v.isNew || !v.id) {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").update(payload).eq("id", v.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      setEditing(null);
      toast.success(t("admin.toast.saved"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      setPendingDelete(null);
      toast.success(t("admin.toast.deleted"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !data) return;
    const oldIdx = data.findIndex((c) => c.id === active.id);
    const newIdx = data.findIndex((c) => c.id === over.id);
    const next = arrayMove(data, oldIdx, newIdx);
    qc.setQueryData(["admin", "categories"], next);
    reorder.mutate(next.map((c) => c.id));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">{t("admin.categories.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.categories.subtitle")}</p>
        </div>
        <Button onClick={() => setEditing({ isNew: true, icon: "Leaf", color: "#1F4D3A", order: data?.length ?? 0 })}>
          <Plus className="h-4 w-4" /> {t("admin.categories.new")}
        </Button>
      </div>

      <div className="rounded-xl border bg-background">
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={(data ?? []).map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <ul>
                {(data ?? []).map((c) => (
                  <SortableRow
                    key={c.id}
                    category={c}
                    lang={lang}
                    onEdit={() => setEditing(c)}
                    onDelete={() => setPendingDelete(c.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.isNew ? t("admin.categories.new") : t("admin.categories.edit")}</DialogTitle>
            <DialogDescription>{t("admin.categories.formDesc")}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Slug</Label>
                <Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              </div>
              <div>
                <Label>Name (EN)</Label>
                <Input value={editing.name_en ?? ""} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} />
              </div>
              <div>
                <Label>Nome (PT)</Label>
                <Input value={editing.name_pt ?? ""} onChange={(e) => setEditing({ ...editing, name_pt: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Description (EN)</Label>
                <Textarea rows={2} value={editing.description_en ?? ""} onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Descrição (PT)</Label>
                <Textarea rows={2} value={editing.description_pt ?? ""} onChange={(e) => setEditing({ ...editing, description_pt: e.target.value })} />
              </div>
              <div>
                <Label>{t("admin.categories.icon")}</Label>
                <div className="flex items-center gap-2">
                  <Input value={editing.icon ?? "Leaf"} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="Leaf" />
                  {(() => {
                    const Icon = getIcon(editing.icon ?? "Leaf");
                    return <span className="grid h-9 w-9 place-items-center rounded-md border"><Icon className="h-4 w-4" /></span>;
                  })()}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t("admin.categories.iconHint")}</p>
              </div>
              <div>
                <Label>{t("admin.categories.color")}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={editing.color ?? "#1F4D3A"} onChange={(e) => setEditing({ ...editing, color: e.target.value })} className="h-9 w-12 cursor-pointer rounded border" />
                  <Input value={editing.color ?? ""} onChange={(e) => setEditing({ ...editing, color: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>{t("admin.confirm.cancel")}</Button>
            <Button onClick={() => editing && save.mutate(editing)} disabled={save.isPending}>{t("admin.toast.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.confirm.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.confirm.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingDelete && remove.mutate(pendingDelete)}>{t("admin.confirm.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortableRow({ category, lang, onEdit, onDelete }: {
  category: Category; lang: string; onEdit: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const Icon = getIcon(category.icon);
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };

  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground active:cursor-grabbing" aria-label="Drag">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ backgroundColor: category.color }}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{lang === "pt" ? category.name_pt : category.name_en}</p>
        <p className="truncate text-xs text-muted-foreground">/{category.slug}</p>
      </div>
      <Button size="icon" variant="ghost" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
    </li>
  );
}
