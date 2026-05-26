import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { adminContentByIdQuery } from "@/lib/admin";
import { ContentForm } from "@/components/admin/ContentForm";

export const Route = createFileRoute("/admin/content/$id/edit")({
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery(adminContentByIdQuery(id));
  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  return <ContentForm existing={data ?? undefined} />;
}
