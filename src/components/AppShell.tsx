import { Outlet } from "react-router-dom";
import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { TopBar } from "./TopBar";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 md:grid md:grid-cols-[16rem_1fr]">
      <aside className="hidden md:sticky md:top-0 md:block md:h-screen">
        <Sidebar />
      </aside>

      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </MobileSidebar>

      <div className="min-w-0">
        <TopBar onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
