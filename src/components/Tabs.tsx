import React, { createContext, useContext, useId, useMemo } from "react";

type TabsContextValue = {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs />");
  return ctx;
}

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const baseId = useId();
  const ctx = useMemo<TabsContextValue>(
    () => ({ value, setValue: onValueChange, baseId }),
    [value, onValueChange, baseId],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={[
        "inline-flex items-center rounded-lg border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-950",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: activeValue, setValue, baseId } = useTabsContext();
  const active = activeValue === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      onClick={() => setValue(value)}
      className={[
        "group inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: activeValue, baseId } = useTabsContext();
  const active = activeValue === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  if (!active) return null;

  return (
    <div role="tabpanel" id={panelId} aria-labelledby={tabId} className={className}>
      {children}
    </div>
  );
}
