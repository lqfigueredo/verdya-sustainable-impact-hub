import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Leaf, LogOut, Shield, User as UserIcon, LayoutDashboard } from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { NotificationsBell } from "./NotificationsBell";

export function Header() {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { key: "library", href: "/library" },
    { key: "events", href: "/events" },
    { key: "community", href: "/community" },
    { key: "resources", href: "/#resources" },
    { key: "about", href: "/#about" },
  ] as const;

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("auth.success.signedOut"));
    navigate({ to: "/" });
  };

  const initials =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()
    || user?.email?.[0]?.toUpperCase() || "V";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground transition group-hover:rotate-6">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight">Verdya</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a key={item.key} href={item.href} className="text-sm text-muted-foreground transition hover:text-foreground">
              {t(`nav.${item.key}`)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <LanguageToggle />
          {isAuthenticated && <NotificationsBell />}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground transition hover:opacity-90">
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user?.user_metadata?.full_name as string | undefined ?? user?.email}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> {t("nav.profile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> {t("nav.dashboard")}
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <Shield className="mr-2 h-4 w-4" /> {t("nav.admin")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <button
                onClick={() => navigate({ to: "/login" })}
                className="hidden rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex"
              >
                {t("nav.login")}
              </button>
              <button
                onClick={() => navigate({ to: "/signup" })}
                className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                {t("nav.signup")}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
