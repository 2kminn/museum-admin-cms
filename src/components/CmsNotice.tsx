import React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type CmsNoticeTone = "success" | "error" | "info";

export type CmsNoticeState = {
  tone: CmsNoticeTone;
  message: string;
};

const toneClasses: Record<CmsNoticeTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",
  info: "border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100",
};

function NoticeIcon({ tone }: { tone: CmsNoticeTone }) {
  if (tone === "success") return <CheckCircle2 className="h-4 w-4" />;
  if (tone === "error") return <AlertCircle className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

export function CmsNotice({
  notice,
  onClose,
}: {
  notice: CmsNoticeState | null;
  onClose: () => void;
}) {
  if (!notice) return null;

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100vw-2rem)] max-w-md">
      <div
        role={notice.tone === "error" ? "alert" : "status"}
        className={[
          "flex items-start gap-3 rounded-xl border p-3 text-sm shadow-lg backdrop-blur",
          toneClasses[notice.tone],
        ].join(" ")}
      >
        <div className="mt-0.5 shrink-0">
          <NoticeIcon tone={notice.tone} />
        </div>
        <div className="min-w-0 flex-1 font-medium">{notice.message}</div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="알림 닫기"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
