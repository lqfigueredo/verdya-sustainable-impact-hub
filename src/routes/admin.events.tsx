import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { adminEventsQuery, type EventRow, type LocationType } from "@/lib/events";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/events")({
  component: AdminEventsPage,
});

type FormState = {
  id?: string;
  title_en: string;
  title_pt: string;
  description_en: string;
  description_pt: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  location_type: LocationType;
  location_detail: string;
  meeting_url: string;
  cover_image_url: string;
  category: string;
  max_attendees: string;
  speakers_json: string;
  published: boolean;
};

const blank: FormState = {
  title_en: "",
  title_pt: "",
  description_en: "",
  description_pt: "",
  starts_at: "",
  ends_at: "",
  timezone: "UTC",
  location_type: "online",
  location_detail: "",
  meeting_url: "",
  cover_image_url: "",
  category: "general",
  max_attendees: "",
  speakers_json: "[]",
  published: false,
};

function rowToForm(r: EventRow): FormState {
  return {
    id: r.id,
    title_en: r.title_en,
    title_pt: r.title_pt,
    description_en: r.description_en ?? "",
    description_pt: r.description_pt ?? "",
    starts_at: r.starts_at.slice(0, 16),
    ends_at: r.ends_at.slice(0, 16),
    timezone: r.timezone,
    location_type: r.location_type,
    location_detail: r.location_detail ?? "",
    meeting_url: r.meeting_url ?? "",
    cover_image_url: r.cover_image_url ?? "",
    category: r.category,
    max_attendees: r.max_attendees?.toString() ?? "",
    speakers_json: JSON.stringify(r.speakers ?? [], null, 2),
    published: r.published,
  };
}

function AdminEventsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: events } = useQuery(adminEventsQuery);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blank);

  const openNew = () => {
    setForm(blank);
    setOpen(true);
  };
  const openEdit = (r: EventRow) => {
    setForm(rowToForm(r));
    setOpen(true);
  };

  const save = async () => {
    let speakers: unknown;
    try {
      speakers = JSON.parse(form.speakers_json || "[]");
    } catch {
      toast.error(t("adminEvents.invalidSpeakers"));
      return;
    }
    const payload = {
      title_en: form.title_en,
      title_pt: form.title_pt,
      description_en: form.description_en || null,
      description_pt: form.description_pt || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      timezone: form.timezone,
      location_type: form.location_type,
      location_detail: form.location_detail || null,
      meeting_url: form.meeting_url || null,
      cover_image_url: form.cover_image_url || null,
      category: form.category,
      max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
      speakers: speakers as never,
      published: form.published,
      created_by: user?.id ?? null,
    };
    const { error } = form.id
      ? await supabase.from("events").update(payload).eq("id", form.id)
      : await supabase.from("events").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success(t("adminEvents.saved"));
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
      qc.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(t("adminEvents.deleted"));
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
    }
  };

  const togglePublish = async (r: EventRow) => {
    await supabase.from("events").update({ published: !r.published }).eq("id", r.id);
    qc.invalidateQueries({ queryKey: ["admin", "events"] });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">{t("adminEvents.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("adminEvents.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> {t("adminEvents.newEvent")}
            </button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id ? t("adminEvents.editEvent") : t("adminEvents.newEvent")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <In label={t("adminEvents.titleEn")} v={form.title_en} on={(v) => setForm({ ...form, title_en: v })} />
              <In label={t("adminEvents.titlePt")} v={form.title_pt} on={(v) => setForm({ ...form, title_pt: v })} />
              <TA label={t("adminEvents.descEn")} v={form.description_en} on={(v) => setForm({ ...form, description_en: v })} />
              <TA label={t("adminEvents.descPt")} v={form.description_pt} on={(v) => setForm({ ...form, description_pt: v })} />
              <In label={t("adminEvents.startsAt")} type="datetime-local" v={form.starts_at} on={(v) => setForm({ ...form, starts_at: v })} />
              <In label={t("adminEvents.endsAt")} type="datetime-local" v={form.ends_at} on={(v) => setForm({ ...form, ends_at: v })} />
              <In label={t("adminEvents.timezone")} v={form.timezone} on={(v) => setForm({ ...form, timezone: v })} />
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("adminEvents.locationType")}
                </span>
                <select
                  value={form.location_type}
                  onChange={(e) => setForm({ ...form, location_type: e.target.value as LocationType })}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="online">{t("events.location.online")}</option>
                  <option value="in_person">{t("events.location.in_person")}</option>
                  <option value="hybrid">{t("events.location.hybrid")}</option>
                </select>
              </label>
              <In label={t("adminEvents.locationDetail")} v={form.location_detail} on={(v) => setForm({ ...form, location_detail: v })} />
              <In label={t("adminEvents.meetingUrl")} v={form.meeting_url} on={(v) => setForm({ ...form, meeting_url: v })} />
              <In label={t("adminEvents.coverImageUrl")} v={form.cover_image_url} on={(v) => setForm({ ...form, cover_image_url: v })} />
              <In label={t("adminEvents.category")} v={form.category} on={(v) => setForm({ ...form, category: v })} />
              <In label={t("adminEvents.maxAttendees")} type="number" v={form.max_attendees} on={(v) => setForm({ ...form, max_attendees: v })} />
              <TA label={t("adminEvents.speakersJson")} v={form.speakers_json} on={(v) => setForm({ ...form, speakers_json: v })} />
              <label className="col-span-full flex items-center gap-2">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                <span className="text-sm">{t("adminEvents.published")}</span>
              </label>
            </div>
            <DialogFooter>
              <button onClick={() => setOpen(false)} className="rounded-full border border-border px-5 py-2 text-sm">
                {t("forum.new.cancel")}
              </button>
              <button onClick={save} className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
                {t("adminEvents.save")}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">{t("adminEvents.col.title")}</th>
              <th className="px-4 py-2">{t("adminEvents.col.when")}</th>
              <th className="px-4 py-2">{t("adminEvents.col.location")}</th>
              <th className="px-4 py-2">{t("adminEvents.col.status")}</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-2 font-medium">{r.title_en}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(r.starts_at).toLocaleString()}
                </td>
                <td className="px-4 py-2">{t(`events.location.${r.location_type}`)}</td>
                <td className="px-4 py-2">
                  <button onClick={() => togglePublish(r)} className="inline-flex items-center gap-1 text-xs">
                    {r.published ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    {r.published ? t("adminEvents.published") : t("adminEvents.draft")}
                  </button>
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => openEdit(r)} className="mr-2 inline-flex items-center text-muted-foreground hover:text-foreground">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="inline-flex items-center text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("adminEvents.confirmDelete")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("adminEvents.confirmDeleteDesc")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("forum.new.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(r.id)}>{t("adminEvents.delete")}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function In({ label, v, on, type = "text" }: { label: string; v: string; on: (s: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={v}
        onChange={(e) => on(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
      />
    </label>
  );
}

function TA({ label, v, on }: { label: string; v: string; on: (s: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        value={v}
        onChange={(e) => on(e.target.value)}
        rows={4}
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary/40 focus:outline-none"
      />
    </label>
  );
}
