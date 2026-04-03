import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireApprovedMuseum({ children }: { children: React.ReactNode }) {
  const { isReady, user } = useAuth();
  const location = useLocation();

  if (!isReady) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (user.role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />;
  if (user.museumStatus === "PENDING_MUSEUM") return <Navigate to="/waiting" replace />;
  if (user.museumStatus === "REJECTED_MUSEUM") return <Navigate to="/rejected" replace />;
  if (user.museumStatus !== "APPROVED_MUSEUM") return <Navigate to="/login" replace />;

  return <>{children}</>;
}
