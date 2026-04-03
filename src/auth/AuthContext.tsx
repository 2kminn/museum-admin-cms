import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "./auth";
import {
  ensureSeededUsers,
  getCurrentUser,
  loadUsers,
  login as loginFn,
  logout as logoutFn,
  registerMuseum,
  resubmitMuseumApplication,
  saveSession,
} from "./auth";

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
    proofFileName: string | null;
  }) => Promise<AuthUser>;
  resubmitApplication: (input: {
    museumName: string;
    contact: string;
    proofFileName: string | null;
  }) => Promise<AuthUser>;
  devImpersonate: (email: string) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(() => {
    setUser(getCurrentUser());
  }, []);

  useEffect(() => {
    ensureSeededUsers();
    setUser(getCurrentUser());
    setIsReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const next = loginFn(email, password);
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    logoutFn();
    setUser(null);
  }, []);

  const register = useCallback(async (input: {
    email: string;
    password: string;
    museumName: string;
    contact: string;
    proofFileName: string | null;
  }) => {
    const next = registerMuseum(input);
    setUser(next);
    return next;
  }, []);

  const resubmit = useCallback(
    async (input: { museumName: string; contact: string; proofFileName: string | null }) => {
      const current = getCurrentUser();
      if (!current) throw new Error("NOT_LOGGED_IN");
      const next = resubmitMuseumApplication({ userId: current.id, ...input });
      setUser(next);
      return next;
    },
    [],
  );

  const devImpersonate = useCallback(async (emailRaw: string) => {
    ensureSeededUsers();
    const email = emailRaw.trim().toLowerCase();
    const users = loadUsers();
    const match = users.find((u) => u.email.toLowerCase() === email);
    if (!match) throw new Error("USER_NOT_FOUND");
    saveSession(match.id);
    setUser(match);
    return match;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      user,
      refresh,
      login,
      logout,
      registerMuseum: register,
      resubmitApplication: resubmit,
      devImpersonate,
    }),
    [isReady, user, refresh, login, logout, register, resubmit, devImpersonate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
