import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, LogOut } from "lucide-react";
import { AdminRoute } from "@/components/auth/ProtectedRoute";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  ),
});

function AdminLayout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Link to="/" className="ml-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {t("admin.backToSite")}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <span className="hidden text-sm text-muted-foreground sm:inline">{name}</span>
              <button
                onClick={async () => { await signOut(); navigate({ to: "/" }); }}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={t("nav.logout")}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
