import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Leaf } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-secondary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-[420px] w-[420px] rounded-full bg-accent/30 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-foreground/10">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-serif text-xl font-semibold">Verdya</span>
        </Link>
        <div className="relative max-w-md">
          <p className="font-serif text-3xl leading-snug">
            "The Verdya circle is the only place where I get to talk ESG with people who actually run programs — not just read about them."
          </p>
          <p className="mt-6 text-sm uppercase tracking-wider text-primary-foreground/70">
            Marina S. · Head of ESG, São Paulo
          </p>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-xl font-semibold">Verdya</span>
          </Link>
          <LanguageToggle />
        </div>
        <div className="hidden justify-end p-6 lg:flex">
          <LanguageToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <h1 className="font-serif text-3xl font-medium tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
