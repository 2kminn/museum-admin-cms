import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "artar_admin:theme_mode";

function getInitialMode(): ThemeMode {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  if (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches) return "dark";
  return "light";
}

function applyHtmlClass(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getInitialMode());

  useEffect(() => {
    applyHtmlClass(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = (next: ThemeMode) => setModeState(next);
  const toggleMode = () => setModeState((m) => (m === "dark" ? "light" : "dark"));

  const value = useMemo<ThemeContextValue>(() => ({ mode, setMode, toggleMode }), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

