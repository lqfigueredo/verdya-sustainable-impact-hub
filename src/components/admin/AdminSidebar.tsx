import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FileText, FolderTree, Users, Settings, Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AdminSidebar() {
  const { t } = useTranslation();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { key: "dashboard", to: "/admin", icon: LayoutDashboard, exact: true },
    { key: "content", to: "/admin/content", icon: FileText },
    { key: "categories", to: "/admin/categories", icon: FolderTree },
    { key: "users", to: "/admin/users", icon: Users },
    { key: "settings", to: "/admin/settings", icon: Settings },
  ] as const;

  const isActive = (to: string, exact?: boolean) =>
    exact ? currentPath === to : currentPath === to || currentPath.startsWith(to + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/admin" className="flex items-center gap-2 px-2 py-1.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-serif text-base font-semibold tracking-tight">Verdya admin</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild isActive={isActive(item.to, item.exact)} tooltip={t(`admin.nav.${item.key}`)}>
                    <Link to={item.to} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{t(`admin.nav.${item.key}`)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
