import { createFileRoute } from "@tanstack/react-router";
import { ContentForm } from "@/components/admin/ContentForm";

export const Route = createFileRoute("/admin/content/new")({
  component: () => <ContentForm />,
});
