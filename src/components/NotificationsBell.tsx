import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Bell, MessageSquare, Reply } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { notificationsQuery } from "@/lib/forum";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { RelativeTime } from "@/components/RelativeTime";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: notifications = [] } = useQuery({
    ...notificationsQuery(user?.id ?? null),
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  if (!user) return null;

  const handleClick = (n: typeof notifications[number]) => {
    const payload = n.payload as { topic_id?: string };
    if (payload?.topic_id) {
      navigate({ to: "/community/topic/$id", params: { id: payload.topic_id } });
    }
    if (!n.read) {
      supabase.from("notifications").update({ read: true }).eq("id", n.id).then(() => {
        qc.invalidateQueries({ queryKey: ["notifications", user.id] });
      });
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => { if (open && unread > 0) markAllRead.mutate(); }}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={t("forum.notifications.title")}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="px-4 py-3 text-sm font-semibold">
          {t("forum.notifications.title")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("forum.notifications.empty")}
            </div>
          ) : (
            notifications.map((n) => {
              const payload = n.payload as { topic_title?: string };
              const Icon = n.type === "reply_to_reply" ? Reply : MessageSquare;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left text-sm transition hover:bg-muted/50",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground">
                      {t(`forum.notifications.types.${n.type}`, {
                        defaultValue: t("forum.notifications.types.reply_to_topic"),
                      })}
                    </p>
                    {payload?.topic_title && (
                      <p className="mt-0.5 truncate font-medium text-foreground">
                        {payload.topic_title}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      <RelativeTime date={n.created_at} />
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <div className="p-2">
          <Link
            to="/community"
            className="block rounded-md px-3 py-2 text-center text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {t("forum.notifications.viewAll")}
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
