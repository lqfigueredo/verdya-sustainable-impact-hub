import { Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

export function RouteErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const queryReset = useQueryErrorResetBoundary();

  useEffect(() => {
    queryReset.reset();
  }, [queryReset]);

  if (typeof window !== "undefined") console.error(error);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h1 className="mt-4 font-serif text-2xl tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong while loading. Try again, or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
