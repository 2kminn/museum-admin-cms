import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const DEFAULT_STORAGE_KEY = "artar_admin:theme_mode";

function getInitialMode(storageKey: string): ThemeMode {
  const saved = window.localStorage.getItem(storageKey);
  if (saved === "light" || saved === "dark") return saved;
  if (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches) return "dark";
  return "light";
}

export function ThemeProvider({
  children,
  storageKey = DEFAULT_STORAGE_KEY,
}: {
  children: React.ReactNode;
  storageKey?: string;
}) {
  const [mode, setModeState] = useState<ThemeMode>(() => getInitialMode(storageKey));

  useEffect(() => {
    window.localStorage.setItem(storageKey, mode);
  }, [mode, storageKey]);

  const setMode = (next: ThemeMode) => setModeState(next);
  const toggleMode = () => setModeState((m) => (m === "dark" ? "light" : "dark"));

  const value = useMemo<ThemeContextValue>(() => ({ mode, setMode, toggleMode }), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeScope({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { mode } = useTheme();
  return (
    <div
      className={[mode === "dark" ? "dark" : "", className ?? ""].join(" ").trim()}
      style={{ colorScheme: mode }}
    >
      {children}
    </div>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
