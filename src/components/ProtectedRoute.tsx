import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useUserRole } from "@/hooks/useUserRole";

interface Props {
  children: ReactNode;
  requiredRole?: "admin" | "student" | "staff";
}

const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // If a specific role is required and user doesn't have it, redirect to their dashboard
  if (requiredRole) {
    const ok =
      requiredRole === "staff"
        ? role === "admin" || role === "trainer"
        : requiredRole === "admin"
          ? role === "admin" || role === "trainer"
          : role === requiredRole;
    if (!ok) return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
