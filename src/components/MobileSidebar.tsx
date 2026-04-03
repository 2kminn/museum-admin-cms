import { X } from "lucide-react";
import React, { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function MobileSidebar({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={[
        "fixed inset-0 z-50 desktop:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
    >
      <div
        className={[
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={[
          "absolute inset-y-0 left-0 w-[18rem] max-w-[85vw] bg-white shadow-soft transition-transform dark:bg-zinc-950",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">메뉴</div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            aria-label="메뉴 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[calc(100%-3.5rem)]">{children}</div>
      </div>
    </div>
  );
}
