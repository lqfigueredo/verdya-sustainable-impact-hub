import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" search={{ redirect: window.location.pathname }} replace />;
  }
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, loading, role } = useAuth();
  if (loading || (isAuthenticated && role === null)) return <FullPageLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" search={{ redirect: window.location.pathname }} replace />;
  }
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
