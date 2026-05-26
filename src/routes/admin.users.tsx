import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Shield, ShieldOff } from "lucide-react";
import { adminUsersQuery, type UserRow } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const { data, isLoading } = useQuery(adminUsersQuery);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [viewing, setViewing] = useState<UserRow | null>(null);
  const [confirmRole, setConfirmRole] = useState<{ user: UserRow; next: "admin" | "member" } | null>(null);

  const filtered = useMemo(
    () => (data ?? []).filter((u) => roleFilter === "all" || u.role === roleFilter),
    [data, roleFilter],
  );

  const setRole = useMutation({
    mutationFn: async ({ userId, next }: { userId: string; next: "admin" | "member" }) => {
      if (next === "admin") {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
        if (error && !error.message.includes("duplicate")) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setConfirmRole(null);
      toast.success(t("admin.toast.updated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">{t("admin.users.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.users.subtitle")}</p>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.filters.allRoles")}</SelectItem>
            <SelectItem value="admin">{t("admin.users.admin")}</SelectItem>
            <SelectItem value="member">{t("admin.users.member")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.users.user")}</TableHead>
              <TableHead>{t("admin.users.email")}</TableHead>
              <TableHead>{t("admin.users.role")}</TableHead>
              <TableHead>{t("admin.users.country")}</TableHead>
              <TableHead>{t("admin.users.joined")}</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{t("admin.users.empty")}</TableCell></TableRow>
            ) : filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                      <AvatarFallback>{(u.full_name ?? u.email ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{u.full_name ?? "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email ?? "—"}</TableCell>
                <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"}>{t(`admin.users.${u.role}`)}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.country ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setViewing(u)}><Eye className="h-4 w-4" /></Button>
                    {u.id !== me?.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title={u.role === "admin" ? t("admin.users.demote") : t("admin.users.promote")}
                        onClick={() => setConfirmRole({ user: u, next: u.role === "admin" ? "member" : "admin" })}
                      >
                        {u.role === "admin" ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.full_name ?? viewing?.email}</DialogTitle>
            <DialogDescription>{viewing?.email}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {viewing.avatar_url && <AvatarImage src={viewing.avatar_url} />}
                  <AvatarFallback>{(viewing.full_name ?? viewing.email ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Badge variant={viewing.role === "admin" ? "default" : "secondary"}>{t(`admin.users.${viewing.role}`)}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">{t("profile.company")}</p><p>{viewing.company ?? "—"}</p></div>
                <div><p className="text-muted-foreground">{t("profile.country")}</p><p>{viewing.country ?? "—"}</p></div>
              </div>
              {viewing.bio && <div><p className="text-sm text-muted-foreground">{t("profile.bio")}</p><p className="text-sm">{viewing.bio}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmRole} onOpenChange={(o) => !o && setConfirmRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmRole?.next === "admin" ? t("admin.users.promote") : t("admin.users.demote")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.users.confirmRole", { name: confirmRole?.user.full_name ?? confirmRole?.user.email, role: confirmRole?.next })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmRole && setRole.mutate({ userId: confirmRole.user.id, next: confirmRole.next })}>
              {t("admin.confirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
