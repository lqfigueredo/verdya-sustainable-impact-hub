import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { favoritesQuery } from "@/lib/library";
import { useNavigate } from "@tanstack/react-router";

export function FavoriteButton({ contentId }: { contentId: string }) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: favorites = [] } = useQuery({ ...favoritesQuery(user?.id ?? null), enabled: !!user });
  const isFav = favorites.includes(contentId);

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (isFav) {
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("content_id", contentId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorites").insert({ user_id: user.id, content_id: contentId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites", user?.id] });
      toast.success(isFav ? t("library.favorites.removed") : t("library.favorites.added"));
    },
    onError: () => toast.error(t("auth.errors.generic")),
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }
    toggle.mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggle.isPending}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
    >
      {isFav ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
      {isFav ? t("library.favorites.saved") : t("library.favorites.save")}
    </button>
  );
}
