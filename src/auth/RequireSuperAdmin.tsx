import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isReady, user } = useAuth();
  const location = useLocation();

  if (!isReady) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== "SUPER_ADMIN") return <Navigate to="/cms" replace />;
  return <>{children}</>;
}

