import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "./auth";
import {
  apiGetMe,
  apiLogin,
  apiRegisterMuseum,
  apiResubmitMuseumApplication,
  clearApiSession,
  getStoredApiUser,
  hasApiSession,
} from "../lib/api";

type AuthContextValue = {
  isReady: boolean;
  user: AuthUser | null;
  refresh: () => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  registerMuseum: (input: {
    email: string;
    password: string;
    museumName: string;
    contact: string;
    proofFile: File | null;
  }) => Promise<AuthUser>;
  resubmitApplication: (input: {
    museumName: string;
    contact: string;
    proofFile: File | null;
  }) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(() => {
    const stored = getStoredApiUser();
    setUser(stored);
    if (!hasApiSession()) return;
    void apiGetMe()
      .then(setUser)
      .catch(() => {
        clearApiSession();
        setUser(null);
      });
  }, []);

  useEffect(() => {
    setUser(getStoredApiUser());
    setIsReady(true);
    if (!hasApiSession()) return;
    void apiGetMe()
      .then(setUser)
      .catch(() => {
        clearApiSession();
        setUser(null);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const next = await apiLogin(email, password);
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    clearApiSession();
    setUser(null);
  }, []);

  const register = useCallback(async (input: {
    email: string;
    password: string;
    museumName: string;
    contact: string;
    proofFile: File | null;
  }) => {
    const next = await apiRegisterMuseum(input);
    setUser(next);
    return next;
  }, []);

  const resubmit = useCallback(
    async (input: { museumName: string; contact: string; proofFile: File | null }) => {
      const next = await apiResubmitMuseumApplication(input);
      setUser(next);
      return next;
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      user,
      refresh,
      login,
      logout,
      registerMuseum: register,
      resubmitApplication: resubmit,
    }),
    [isReady, user, refresh, login, logout, register, resubmit],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
