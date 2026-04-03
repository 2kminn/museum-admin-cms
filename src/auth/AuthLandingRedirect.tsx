import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function AuthLandingRedirect() {
  const { isReady, user } = useAuth();
  if (!isReady) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />;
  if (user.museumStatus === "PENDING_MUSEUM") return <Navigate to="/waiting" replace />;
  if (user.museumStatus === "APPROVED_MUSEUM") return <Navigate to="/cms" replace />;
  if (user.museumStatus === "REJECTED_MUSEUM") return <Navigate to="/rejected" replace />;
  return <Navigate to="/login" replace />;
}
