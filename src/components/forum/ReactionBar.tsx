import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ThumbsUp, Lightbulb, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  forumReactionsQuery,
  type ReactionTarget,
  type ReactionType,
} from "@/lib/forum";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const REACTIONS: { type: ReactionType; Icon: typeof ThumbsUp; key: string }[] = [
  { type: "like", Icon: ThumbsUp, key: "like" },
  { type: "insightful", Icon: Lightbulb, key: "insightful" },
  { type: "agree", Icon: Check, key: "agree" },
];

export function ReactionBar({
  targetType,
  targetId,
}: {
  targetType: ReactionTarget;
  targetId: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: reactions = [] } = useQuery(forumReactionsQuery(targetType, [targetId]));

  const countsByType = REACTIONS.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = reactions.filter((x) => x.reaction_type === r.type).length;
    return acc;
  }, {});

  const myReactions = new Set(
    reactions.filter((r) => r.user_id === user?.id).map((r) => r.reaction_type),
  );

  const toggle = useMutation({
    mutationFn: async (type: ReactionType) => {
      if (!user) throw new Error("auth");
      if (myReactions.has(type)) {
        const { error } = await supabase
          .from("forum_reactions")
          .delete()
          .eq("target_type", targetType)
          .eq("target_id", targetId)
          .eq("user_id", user.id)
          .eq("reaction_type", type);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("forum_reactions").insert({
          target_type: targetType,
          target_id: targetId,
          user_id: user.id,
          reaction_type: type,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forum-reactions", targetType] });
      qc.invalidateQueries({ queryKey: ["forum-topics"] });
    },
    onError: () => toast.error(t("forum.errors.reaction")),
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {REACTIONS.map(({ type, Icon, key }) => {
        const active = myReactions.has(type);
        const count = countsByType[type] ?? 0;
        return (
          <button
            key={type}
            type="button"
            disabled={!user || toggle.isPending}
            onClick={() => toggle.mutate(type)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
              active
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
              !user && "cursor-not-allowed opacity-60",
            )}
            title={t(`forum.reactions.${key}`)}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{t(`forum.reactions.${key}`)}</span>
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
